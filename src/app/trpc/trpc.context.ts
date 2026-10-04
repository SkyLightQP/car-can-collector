import type { IncomingHttpHeaders } from 'node:http';
import type { AuthUser, Context } from './trpc';

export interface AuthSessionReader {
  findUser(headers: IncomingHttpHeaders): Promise<AuthUser | null>;
}

interface ContextRequest {
  req: { headers: IncomingHttpHeaders };
}

export function createContextFactory(sessionReader: AuthSessionReader) {
  return async ({ req }: ContextRequest): Promise<Context> => ({
    user: await sessionReader.findUser(req.headers),
  });
}
