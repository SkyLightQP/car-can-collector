import type { McpHttpHandler } from '@modelcontextprotocol/server';
import type { BetterAuthInstance } from './better-auth';
import { createMcpRoute } from './mcp-route';

const TOKEN_ISSUED_AT_SECONDS = 1_800_000_000;
const mockClaims = {
  azp: 'https://claude.ai/oauth/mcp-oauth-client-metadata',
  sub: 'user-1',
  iat: TOKEN_ISSUED_AT_SECONDS,
};
const mockChallenge =
  'Bearer resource_metadata="https://collector.example.com/.well-known/oauth-protected-resource/mcp"';

jest.mock('@better-auth/mcp', () => ({
  requireMcpAuth:
    (_auth: unknown, handler: (request: Request, claims: object) => Promise<Response>) => (request: Request) =>
      request.headers.has('authorization')
        ? handler(request, mockClaims)
        : Promise.resolve(new Response(null, { status: 401, headers: { 'www-authenticate': mockChallenge } })),
}));

const RESOURCE = 'https://collector.example.com/mcp';

interface ConsentRow {
  clientId: string;
  userId: string;
  createdAt: Date;
}

function consentCreatedAt(milliseconds: number): ConsentRow {
  return { clientId: mockClaims.azp, userId: mockClaims.sub, createdAt: new Date(milliseconds) };
}

const grantedConsent = consentCreatedAt((TOKEN_ISSUED_AT_SECONDS - 60) * 1000);

interface WhereClause {
  field: keyof ConsentRow;
  value: unknown;
}

function authWithConsents(consents: ConsentRow[]): BetterAuthInstance {
  const adapter = {
    findOne: ({ model, where }: { model: string; where: WhereClause[] }) =>
      Promise.resolve(
        model === 'oauthConsent'
          ? (consents.find((consent) => where.every(({ field, value }) => consent[field] === value)) ?? null)
          : null
      ),
  };
  return { $context: Promise.resolve({ adapter }) } as unknown as BetterAuthInstance;
}

function createRouteCapturing(received: Request[], consents: ConsentRow[] = [grantedConsent]) {
  const mcp = {
    fetch: (request: Request) => {
      received.push(request);
      return Promise.resolve(new Response(null, { status: 204 }));
    },
  } as unknown as McpHttpHandler;
  return createMcpRoute(authWithConsents(consents), mcp, RESOURCE);
}

function mcpCall(url = 'http://internal:3000/mcp'): Request {
  return new Request(url, { method: 'POST', headers: { authorization: 'Bearer t' }, body: '{}' });
}

describe('createMcpRoute', () => {
  it('프록시 뒤 내부 주소로 들어온 요청을 MCP 리소스 origin 의 같은 경로와 쿼리로 넘긴다', async () => {
    const received: Request[] = [];
    const route = createRouteCapturing(received);

    await route(mcpCall('http://internal:3000/mcp?x=1'));

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

  it('토큰의 client 와 사용자에 대한 동의가 있으면 MCP 핸들러의 응답을 돌려준다', async () => {
    const received: Request[] = [];
    const route = createRouteCapturing(received);

    const response = await route(mcpCall());

    expect(response.status).toBe(204);
    expect(received).toHaveLength(1);
  });

  it('동의가 없으면 토큰 없는 요청과 같은 401 인증 요구를 돌려주고 MCP 핸들러를 부르지 않는다', async () => {
    const received: Request[] = [];
    const route = createRouteCapturing(received, []);

    const response = await route(mcpCall());

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe(mockChallenge);
    expect(received).toHaveLength(0);
  });

  it('다른 사용자나 다른 client 의 동의만 있으면 401 이다', async () => {
    const received: Request[] = [];
    const route = createRouteCapturing(received, [
      { ...grantedConsent, userId: 'user-2' },
      { ...grantedConsent, clientId: 'https://chatgpt.com/oauth/client-metadata' },
    ]);

    const response = await route(mcpCall());

    expect(response.status).toBe(401);
    expect(received).toHaveLength(0);
  });

  it('철회 뒤 다시 동의했으면 그 전에 발급된 토큰은 401 이다', async () => {
    const received: Request[] = [];
    const route = createRouteCapturing(received, [consentCreatedAt((TOKEN_ISSUED_AT_SECONDS + 1) * 1000)]);

    const response = await route(mcpCall());

    expect(response.status).toBe(401);
    expect(received).toHaveLength(0);
  });

  it('동의와 같은 초에 발급된 토큰은 동의 시각의 밀리초가 더 늦어도 통과한다', async () => {
    const received: Request[] = [];
    const route = createRouteCapturing(received, [consentCreatedAt(TOKEN_ISSUED_AT_SECONDS * 1000 + 800)]);

    const response = await route(mcpCall());

    expect(response.status).toBe(204);
    expect(received).toHaveLength(1);
  });
});
