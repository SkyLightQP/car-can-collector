import http from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import request from 'supertest';
import { toExpressHandler, type ExpressHandlerOptions, type FetchHandler } from './fetch-handler';

function createApp(handler: FetchHandler, options?: ExpressHandlerOptions) {
  const app = express();
  app.all('/mcp', toExpressHandler(handler, options));
  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    void _next;
    res.status(500).json({ message: error.message });
  });
  return app;
}

describe('toExpressHandler', () => {
  it('메서드, 경로, 쿼리, 헤더, 본문을 Fetch 요청으로 넘긴다', async () => {
    let received: { url: string; method: string; authorization: string | null; body: unknown } | undefined;
    const app = createApp(async (fetchRequest) => {
      received = {
        url: fetchRequest.url,
        method: fetchRequest.method,
        authorization: fetchRequest.headers.get('authorization'),
        body: await fetchRequest.json(),
      };
      return new Response(null, { status: 204 });
    });

    await request(app).post('/mcp?x=1').set('authorization', 'Bearer t').send({ hello: 'world' }).expect(204);

    expect(received?.url.endsWith('/mcp?x=1')).toBe(true);
    expect(received?.method).toBe('POST');
    expect(received?.authorization).toBe('Bearer t');
    expect(received?.body).toEqual({ hello: 'world' });
  });

  it('origin 을 지정하면 프록시 뒤의 요청 프로토콜과 호스트 대신 그 origin 에 경로와 쿼리를 붙인다', async () => {
    let receivedUrl: string | undefined;
    const app = createApp(
      (fetchRequest) => {
        receivedUrl = fetchRequest.url;
        return Promise.resolve(new Response(null, { status: 204 }));
      },
      { origin: 'https://api.example.com' }
    );

    await request(app).post('/mcp?x=1').set('host', 'internal:3000').send({}).expect(204);

    expect(receivedUrl).toBe('https://api.example.com/mcp?x=1');
  });

  it('Fetch 응답의 상태, 헤더, 본문을 그대로 돌려준다', async () => {
    const app = createApp(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'www-authenticate': 'Bearer resource_metadata="x"', 'content-type': 'application/json' },
        })
      )
    );

    const response = await request(app).get('/mcp').expect(401);

    expect(response.headers['www-authenticate']).toBe('Bearer resource_metadata="x"');
    expect(response.body).toEqual({ error: 'unauthorized' });
  });

  it('여러 set-cookie 헤더를 모두 돌려준다', async () => {
    const app = createApp(() => {
      const headers = new Headers();
      headers.append('set-cookie', 'a=1');
      headers.append('set-cookie', 'b=2');
      return Promise.resolve(new Response(null, { status: 200, headers }));
    });

    const response = await request(app).get('/mcp').expect(200);

    expect(response.headers['set-cookie']).toEqual(['a=1', 'b=2']);
  });

  it('스트리밍 응답(text/event-stream)을 그대로 흘린다', async () => {
    const encoder = new TextEncoder();
    const app = createApp(() => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: one\n\n'));
          controller.enqueue(encoder.encode('data: two\n\n'));
          controller.close();
        },
      });
      return Promise.resolve(new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } }));
    });

    const response = await request(app)
      .get('/mcp')
      .buffer(true)
      .parse((res, callback) => {
        let text = '';
        res.on('data', (chunk) => (text += chunk));
        res.on('end', () => callback(null, text));
      })
      .expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.body).toBe('data: one\n\ndata: two\n\n');
  });

  it('본문 스트림이 중간에 오류를 내도 프로세스가 죽지 않고 응답이 종료된다', async () => {
    const encoder = new TextEncoder();
    const app = createApp(() => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: one'));
          setTimeout(() => controller.error(new Error('stream failure')), 20);
        },
      });
      return Promise.resolve(new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } }));
    });

    const server = app.listen(0);
    const { port } = server.address() as AddressInfo;

    const outcome = await new Promise<string>((resolve) => {
      const clientRequest = http.get({ port, path: '/mcp' }, (res) => {
        res.on('data', () => undefined);
        res.on('error', () => undefined);
        res.on('close', () => resolve('closed'));
      });
      clientRequest.on('error', () => resolve('closed'));
    });
    server.close();

    expect(outcome).toBe('closed');
  });

  it('클라이언트가 응답 도중 연결을 끊으면 원본 스트림을 취소한다', async () => {
    const encoder = new TextEncoder();
    const cancel = jest.fn();
    const app = createApp(() => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: one'));
        },
        cancel,
      });
      return Promise.resolve(new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } }));
    });
    const server = app.listen(0);
    const { port } = server.address() as AddressInfo;

    await new Promise<void>((resolve) => {
      const clientRequest = http.get({ port, path: '/mcp' }, (res) => {
        res.once('data', () => {
          clientRequest.destroy();
          resolve();
        });
      });
      clientRequest.on('error', () => undefined);
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    server.close();

    expect(cancel).toHaveBeenCalled();
  });

  it('핸들러가 던지면 Express 오류 처리로 넘긴다', async () => {
    const app = createApp(() => Promise.reject(new Error('boom')));

    const response = await request(app).get('/mcp').expect(500);

    expect(response.body).toEqual({ message: 'boom' });
  });
});
