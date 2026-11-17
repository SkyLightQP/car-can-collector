import type { McpHttpHandler } from '@modelcontextprotocol/server';
import { requireMcpAuth } from '@better-auth/mcp';
import type { FetchHandler } from '../http/fetch-handler';
import type { BetterAuthInstance } from './better-auth';

export function createMcpRoute(auth: BetterAuthInstance, mcp: McpHttpHandler, resource: string): FetchHandler {
  return requireMcpAuth(auth, (request) => mcp.fetch(request), { resource });
}
