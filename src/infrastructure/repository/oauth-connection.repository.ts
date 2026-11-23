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

@Injectable()
export class OAuthConnectionRepository {
  constructor(private readonly dataSource: DataSource) {}

  findByUser(userId: string): Promise<OAuthConnectionRow[]> {
    return this.dataSource.query<OAuthConnectionRow[]>(
      `
      SELECT consent.id                      AS "id",
             consent.client_id               AS "clientId",
             client.name                     AS "clientName",
             consent.scopes                  AS "scopes",
             consent.created_at              AS "connectedAt",
             refresh_token.last_issued_at    AS "lastTokenIssuedAt"
        FROM auth_oauth_consent consent
        JOIN auth_oauth_client client ON client.client_id = consent.client_id
        LEFT JOIN (
               SELECT client_id, MAX(created_at) AS last_issued_at
                 FROM auth_oauth_refresh_token
                WHERE user_id = $1
                GROUP BY client_id
             ) refresh_token ON refresh_token.client_id = consent.client_id
       WHERE consent.user_id = $1
       ORDER BY consent.created_at DESC
      `,
      [userId]
    );
  }

  async revoke(userId: string, consentId: string): Promise<boolean> {
    const revokedConsents = await this.dataSource.query<{ clientId: string }[]>(
      `
      WITH revoked_consent AS (
             DELETE FROM auth_oauth_consent
              WHERE id = $1 AND user_id = $2
             RETURNING client_id
           ),
           revoked_refresh_tokens AS (
             UPDATE auth_oauth_refresh_token
                SET revoked = now()
              WHERE client_id IN (SELECT client_id FROM revoked_consent)
                AND user_id = $2
                AND revoked IS NULL
           ),
           revoked_access_tokens AS (
             UPDATE auth_oauth_access_token
                SET revoked = now()
              WHERE client_id IN (SELECT client_id FROM revoked_consent)
                AND user_id = $2
                AND revoked IS NULL
           )
      SELECT client_id AS "clientId" FROM revoked_consent
      `,
      [consentId, userId]
    );
    return revokedConsents.length > 0;
  }
}
