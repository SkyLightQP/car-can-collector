import type { McpHttpHandler } from '@modelcontextprotocol/server';
import { requireMcpAuth } from '@better-auth/mcp';
import type { BetterAuthInstance } from './better-auth';

export function createMcpRoute(
  auth: BetterAuthInstance,
  mcp: McpHttpHandler,
  resource: string
): (request: Request) => Promise<Response> {
  const resourceOrigin = new URL(resource).origin;
  const authorizedMcp = requireMcpAuth(auth, (request) => mcp.fetch(request), { resource });
  return (request) => authorizedMcp(moveToResourceOrigin(request, resourceOrigin));
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
