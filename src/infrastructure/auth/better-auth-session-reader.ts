import type { IncomingHttpHeaders } from 'node:http';
import { fromNodeHeaders } from 'better-auth/node';
import type { AuthUser } from '@app/trpc/trpc';
import type { AuthSessionReader } from '@app/trpc/trpc.context';
import type { BetterAuthInstance } from './better-auth';

export class BetterAuthSessionReader implements AuthSessionReader {
  constructor(private readonly auth: BetterAuthInstance) {}

  async findUser(headers: IncomingHttpHeaders): Promise<AuthUser | null> {
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(headers) });
    if (!session) return null;

    const { id, email, name } = session.user;
    return { id, email, name };
  }
}
