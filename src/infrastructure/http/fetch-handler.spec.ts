import express from 'express';
import request from 'supertest';
import { toExpressHandler, type FetchHandler } from './fetch-handler';

function createApp(handler: FetchHandler) {
  const app = express();
  app.all('/mcp', toExpressHandler(handler));
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

  it('핸들러가 던지면 Express 오류 처리로 넘긴다', async () => {
    const app = createApp(() => Promise.reject(new Error('boom')));

    const response = await request(app).get('/mcp').expect(500);

    expect(response.body).toEqual({ message: 'boom' });
  });
});
