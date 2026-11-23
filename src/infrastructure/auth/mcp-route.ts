import type { McpHttpHandler } from '@modelcontextprotocol/server';
import { requireMcpAuth } from '@better-auth/mcp';
import type { BetterAuthInstance } from './better-auth';

export function createMcpRoute(
  auth: BetterAuthInstance,
  mcp: McpHttpHandler,
  resource: string
): (request: Request) => Promise<Response> {
  const resourceOrigin = new URL(resource).origin;
  const authorizedMcp: (request: Request) => Promise<Response> = requireMcpAuth(
    auth,
    async (request, { azp, sub, iat }) => {
      if (await isCoveredByCurrentConsent(auth, azp, sub, iat)) return mcp.fetch(request);
      return authorizedMcp(withoutCredentials(request));
    },
    { resource }
  );
  return (request) => authorizedMcp(moveToResourceOrigin(request, resourceOrigin));
}

async function isCoveredByCurrentConsent(
  auth: BetterAuthInstance,
  clientId: unknown,
  userId: string | undefined,
  issuedAtSeconds: number | undefined
): Promise<boolean> {
  if (typeof clientId !== 'string' || !userId || issuedAtSeconds === undefined) return false;
  const { adapter } = await auth.$context;
  const consent = await adapter.findOne<{ createdAt: Date }>({
    model: 'oauthConsent',
    where: [
      { field: 'clientId', value: clientId },
      { field: 'userId', value: userId },
    ],
  });
  if (!consent) return false;
  return issuedAtSeconds >= Math.floor(consent.createdAt.getTime() / 1000);
}

function withoutCredentials(request: Request): Request {
  const headers = new Headers(request.headers);
  headers.delete('authorization');
  headers.delete('dpop');
  return new Request(request.url, { method: request.method, headers });
}

function moveToResourceOrigin(request: Request, origin: string): Request {
  const { pathname, search } = new URL(request.url);
  const streamingInit: RequestInit & { duplex: 'half' } = {
    method: request.method,
    headers: request.headers,
    body: request.body,
    duplex: 'half',
    signal: request.signal,
  };
  return new Request(`${origin}${pathname}${search}`, streamingInit);
}
