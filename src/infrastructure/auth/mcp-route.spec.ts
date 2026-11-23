import type { McpHttpHandler } from '@modelcontextprotocol/server';
import type { BetterAuthInstance } from './better-auth';
import { createMcpRoute } from './mcp-route';

jest.mock('@better-auth/mcp', () => ({
  requireMcpAuth:
    (_auth: unknown, handler: (request: Request, claims: object) => Promise<Response>) => (request: Request) =>
      handler(request, {}),
}));

const RESOURCE = 'https://collector.example.com/mcp';

function createRouteCapturing(received: Request[]) {
  const mcp = {
    fetch: (request: Request) => {
      received.push(request);
      return Promise.resolve(new Response(null, { status: 204 }));
    },
  } as unknown as McpHttpHandler;
  return createMcpRoute({} as BetterAuthInstance, mcp, RESOURCE);
}

describe('createMcpRoute', () => {
  it('프록시 뒤 내부 주소로 들어온 요청을 MCP 리소스 origin 의 같은 경로와 쿼리로 넘긴다', async () => {
    const received: Request[] = [];
    const route = createRouteCapturing(received);

    await route(new Request('http://internal:3000/mcp?x=1'));

    expect(received[0].url).toBe('https://collector.example.com/mcp?x=1');
  });

  it('메서드, 헤더, 본문을 그대로 넘긴다', async () => {
    const received: Request[] = [];
    const route = createRouteCapturing(received);

    await route(
      new Request('http://internal:3000/mcp', {
        method: 'POST',
        headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
        body: JSON.stringify({ hello: 'world' }),
      })
    );

    expect(received[0].method).toBe('POST');
    expect(received[0].headers.get('authorization')).toBe('Bearer t');
    expect(await received[0].json()).toEqual({ hello: 'world' });
  });
});
