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
    async (request, { azp, sub }) => {
      if (await hasConsent(auth, azp, sub)) return mcp.fetch(request);
      return authorizedMcp(withoutCredentials(request));
    },
    { resource }
  );
  return (request) => authorizedMcp(moveToResourceOrigin(request, resourceOrigin));
}

async function hasConsent(auth: BetterAuthInstance, clientId: unknown, userId: string | undefined): Promise<boolean> {
  if (typeof clientId !== 'string' || !userId) return false;
  const { adapter } = await auth.$context;
  const consent = await adapter.findOne({
    model: 'oauthConsent',
    where: [
      { field: 'clientId', value: clientId },
      { field: 'userId', value: userId },
    ],
  });
  return consent !== null;
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
