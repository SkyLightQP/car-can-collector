import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface OAuthConnectionRow {
  id: string;
  clientId: string;
  clientName: string | null;
  scopes: string[];
  connectedAt: Date;
  lastTokenIssuedAt: Date | null;
}

const TOKEN_TABLES = ['auth_oauth_refresh_token', 'auth_oauth_access_token'];

@Injectable()
export class OAuthConnectionRepository {
  constructor(private readonly dataSource: DataSource) {}

  findByUser(userId: string): Promise<OAuthConnectionRow[]> {
    return this.dataSource
      .createQueryBuilder()
      .select('consent.id', 'id')
      .addSelect('consent.client_id', 'clientId')
      .addSelect('client.name', 'clientName')
      .addSelect('consent.scopes', 'scopes')
      .addSelect('consent.created_at', 'connectedAt')
      .addSelect('refresh_token.last_issued_at', 'lastTokenIssuedAt')
      .from('auth_oauth_consent', 'consent')
      .innerJoin('auth_oauth_client', 'client', 'client.client_id = consent.client_id')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('token.client_id', 'client_id')
            .addSelect('MAX(token.created_at)', 'last_issued_at')
            .from('auth_oauth_refresh_token', 'token')
            .where('token.user_id = :userId')
            .groupBy('token.client_id'),
        'refresh_token',
        'refresh_token.client_id = consent.client_id'
      )
      .where('consent.user_id = :userId', { userId })
      .orderBy('consent.created_at', 'DESC')
      .getRawMany<OAuthConnectionRow>();
  }

  revoke(userId: string, consentId: string): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const deleted = await manager
        .createQueryBuilder()
        .delete()
        .from('auth_oauth_consent')
        .where('id = :consentId AND user_id = :userId', { consentId, userId })
        .returning('client_id')
        .execute();
      const [revokedConsent] = deleted.raw as { client_id: string }[];
      if (!revokedConsent) return false;

      for (const tokenTable of TOKEN_TABLES) {
        await manager
          .createQueryBuilder()
          .update(tokenTable)
          .set({ revoked: () => 'now()' })
          .where('client_id = :clientId AND user_id = :userId AND revoked IS NULL', {
            clientId: revokedConsent.client_id,
            userId,
          })
          .execute();
      }
      return true;
    });
  }
}
