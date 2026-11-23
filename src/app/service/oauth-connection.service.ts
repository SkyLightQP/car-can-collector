import { Injectable } from '@nestjs/common';
import type { OAuthConnectionOperations } from '@app/trpc/routers/oauth-connection.router';
import type { OAuthConnectionView, RevokeOAuthConnectionInput } from '@app/trpc/schemas/oauth-connection.schema';
import {
  type OAuthConnectionRow,
  OAuthConnectionRepository,
} from '@infrastructure/repository/oauth-connection.repository';

@Injectable()
export class OAuthConnectionService implements OAuthConnectionOperations {
  constructor(private readonly oauthConnectionRepository: OAuthConnectionRepository) {}

  async listOAuthConnections(userId: string): Promise<OAuthConnectionView[]> {
    const connections = await this.oauthConnectionRepository.findByUser(userId);
    return connections.map(toView);
  }

  async revokeOAuthConnection(
    userId: string,
    { id }: RevokeOAuthConnectionInput
  ): Promise<RevokeOAuthConnectionInput | null> {
    const revoked = await this.oauthConnectionRepository.revoke(userId, id);
    return revoked ? { id } : null;
  }
}

function toView(connection: OAuthConnectionRow): OAuthConnectionView {
  return {
    id: connection.id,
    clientId: connection.clientId,
    clientName: connection.clientName,
    scopes: connection.scopes,
    connectedAt: connection.connectedAt.toISOString(),
    lastTokenIssuedAt: connection.lastTokenIssuedAt?.toISOString() ?? null,
  };
}
