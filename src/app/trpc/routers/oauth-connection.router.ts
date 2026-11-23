import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc';
import {
  oauthConnectionsSchema,
  type OAuthConnectionView,
  type RevokeOAuthConnectionInput,
  revokeOAuthConnectionInputSchema,
} from '../schemas/oauth-connection.schema';

export interface OAuthConnectionOperations {
  listOAuthConnections(userId: string): Promise<OAuthConnectionView[]>;
  revokeOAuthConnection(userId: string, input: RevokeOAuthConnectionInput): Promise<RevokeOAuthConnectionInput | null>;
}

export function createOAuthConnectionRouter(operations: OAuthConnectionOperations) {
  return router({
    list: protectedProcedure
      .output(oauthConnectionsSchema)
      .query(({ ctx }) => operations.listOAuthConnections(ctx.user.id)),
    revoke: protectedProcedure
      .input(revokeOAuthConnectionInputSchema)
      .output(revokeOAuthConnectionInputSchema)
      .mutation(async ({ ctx, input }) => {
        const revoked = await operations.revokeOAuthConnection(ctx.user.id, input);
        if (revoked === null) throw new TRPCError({ code: 'NOT_FOUND', message: '연결된 앱이 없다' });
        return revoked;
      }),
  });
}
