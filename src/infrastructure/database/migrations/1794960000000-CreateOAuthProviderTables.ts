import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOAuthProviderTables1794960000000 implements MigrationInterface {
  name = 'CreateOAuthProviderTables1794960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_jwks" (
        "id"          TEXT        NOT NULL,
        "public_key"  TEXT        NOT NULL,
        "private_key" TEXT        NOT NULL,
        "created_at"  TIMESTAMPTZ NOT NULL,
        "expires_at"  TIMESTAMPTZ,
        "alg"         TEXT,
        "crv"         TEXT,
        CONSTRAINT "PK_auth_jwks" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_oauth_client" (
        "id"                                  TEXT        NOT NULL,
        "client_id"                           TEXT        NOT NULL,
        "client_secret"                       TEXT,
        "client_discovery_id"                 TEXT,
        "disabled"                            BOOLEAN,
        "skip_consent"                        BOOLEAN,
        "enable_end_session"                  BOOLEAN,
        "subject_type"                        TEXT,
        "scopes"                              JSONB,
        "client_credentials_scopes"           JSONB,
        "user_id"                             TEXT,
        "created_at"                          TIMESTAMPTZ,
        "updated_at"                          TIMESTAMPTZ,
        "name"                                TEXT,
        "uri"                                 TEXT,
        "icon"                                TEXT,
        "contacts"                            JSONB,
        "tos"                                 TEXT,
        "policy"                              TEXT,
        "software_id"                         TEXT,
        "software_version"                    TEXT,
        "software_statement"                  TEXT,
        "redirect_uris"                       JSONB       NOT NULL,
        "post_logout_redirect_uris"           JSONB,
        "backchannel_logout_uri"              TEXT,
        "backchannel_logout_session_required" BOOLEAN,
        "token_endpoint_auth_method"          TEXT,
        "application_type"                    TEXT,
        "jwks"                                TEXT,
        "jwks_uri"                            TEXT,
        "grant_types"                         JSONB,
        "response_types"                      JSONB,
        "require_pkce"                        BOOLEAN,
        "dpop_bound_access_tokens"            BOOLEAN,
        "reference_id"                        TEXT,
        "metadata"                            JSONB,
        CONSTRAINT "PK_auth_oauth_client" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_auth_oauth_client_client_id" UNIQUE ("client_id"),
        CONSTRAINT "FK_auth_oauth_client_user" FOREIGN KEY ("user_id") REFERENCES "auth_user" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_client_user_id" ON "auth_oauth_client" ("user_id")`
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_oauth_resource" (
        "id"                                TEXT        NOT NULL,
        "identifier"                        TEXT        NOT NULL,
        "name"                              TEXT        NOT NULL,
        "access_token_ttl"                  INTEGER,
        "refresh_token_ttl"                 INTEGER,
        "signing_algorithm"                 TEXT,
        "signing_key_id"                    TEXT,
        "allowed_scopes"                    JSONB,
        "custom_claims"                     JSONB,
        "dpop_bound_access_tokens_required" BOOLEAN,
        "disabled"                          BOOLEAN,
        "created_at"                        TIMESTAMPTZ,
        "updated_at"                        TIMESTAMPTZ,
        "policy_version"                    INTEGER,
        "metadata"                          JSONB,
        CONSTRAINT "PK_auth_oauth_resource" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_auth_oauth_resource_identifier" UNIQUE ("identifier")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_oauth_client_resource" (
        "id"          TEXT        NOT NULL,
        "client_id"   TEXT        NOT NULL,
        "resource_id" TEXT        NOT NULL,
        "metadata"    JSONB,
        "created_at"  TIMESTAMPTZ,
        CONSTRAINT "PK_auth_oauth_client_resource" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_auth_oauth_client_resource_client_resource" UNIQUE ("client_id", "resource_id"),
        CONSTRAINT "FK_auth_oauth_client_resource_client" FOREIGN KEY ("client_id") REFERENCES "auth_oauth_client" ("client_id") ON DELETE CASCADE,
        CONSTRAINT "FK_auth_oauth_client_resource_resource" FOREIGN KEY ("resource_id") REFERENCES "auth_oauth_resource" ("identifier") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_client_resource_client_id" ON "auth_oauth_client_resource" ("client_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_client_resource_resource_id" ON "auth_oauth_client_resource" ("resource_id")`
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_oauth_refresh_token" (
        "id"                         TEXT        NOT NULL,
        "token"                      TEXT        NOT NULL,
        "client_id"                  TEXT        NOT NULL,
        "session_id"                 TEXT,
        "user_id"                    TEXT        NOT NULL,
        "reference_id"               TEXT,
        "authorization_code_id"      TEXT,
        "resources"                  JSONB,
        "requested_user_info_claims" JSONB,
        "expires_at"                 TIMESTAMPTZ NOT NULL,
        "created_at"                 TIMESTAMPTZ NOT NULL,
        "revoked"                    TIMESTAMPTZ,
        "rotated_at"                 TIMESTAMPTZ,
        "rotation_replay_response"   TEXT,
        "rotation_replay_expires_at" TIMESTAMPTZ,
        "auth_time"                  TIMESTAMPTZ,
        "confirmation"               JSONB,
        "scopes"                     JSONB       NOT NULL,
        CONSTRAINT "PK_auth_oauth_refresh_token" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_auth_oauth_refresh_token_token" UNIQUE ("token"),
        CONSTRAINT "FK_auth_oauth_refresh_token_client" FOREIGN KEY ("client_id") REFERENCES "auth_oauth_client" ("client_id") ON DELETE CASCADE,
        CONSTRAINT "FK_auth_oauth_refresh_token_session" FOREIGN KEY ("session_id") REFERENCES "auth_session" ("id") ON DELETE SET NULL,
        CONSTRAINT "FK_auth_oauth_refresh_token_user" FOREIGN KEY ("user_id") REFERENCES "auth_user" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_refresh_token_client_id" ON "auth_oauth_refresh_token" ("client_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_refresh_token_session_id" ON "auth_oauth_refresh_token" ("session_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_refresh_token_user_id" ON "auth_oauth_refresh_token" ("user_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_refresh_token_authorization_code_id" ON "auth_oauth_refresh_token" ("authorization_code_id")`
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_oauth_access_token" (
        "id"                         TEXT        NOT NULL,
        "token"                      TEXT        NOT NULL,
        "client_id"                  TEXT        NOT NULL,
        "session_id"                 TEXT,
        "user_id"                    TEXT,
        "reference_id"               TEXT,
        "authorization_code_id"      TEXT,
        "resources"                  JSONB,
        "requested_user_info_claims" JSONB,
        "refresh_id"                 TEXT,
        "expires_at"                 TIMESTAMPTZ NOT NULL,
        "created_at"                 TIMESTAMPTZ NOT NULL,
        "revoked"                    TIMESTAMPTZ,
        "confirmation"               JSONB,
        "scopes"                     JSONB       NOT NULL,
        CONSTRAINT "PK_auth_oauth_access_token" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_auth_oauth_access_token_token" UNIQUE ("token"),
        CONSTRAINT "FK_auth_oauth_access_token_client" FOREIGN KEY ("client_id") REFERENCES "auth_oauth_client" ("client_id") ON DELETE CASCADE,
        CONSTRAINT "FK_auth_oauth_access_token_session" FOREIGN KEY ("session_id") REFERENCES "auth_session" ("id") ON DELETE SET NULL,
        CONSTRAINT "FK_auth_oauth_access_token_user" FOREIGN KEY ("user_id") REFERENCES "auth_user" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_auth_oauth_access_token_refresh" FOREIGN KEY ("refresh_id") REFERENCES "auth_oauth_refresh_token" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_access_token_client_id" ON "auth_oauth_access_token" ("client_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_access_token_session_id" ON "auth_oauth_access_token" ("session_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_access_token_user_id" ON "auth_oauth_access_token" ("user_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_access_token_refresh_id" ON "auth_oauth_access_token" ("refresh_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_access_token_authorization_code_id" ON "auth_oauth_access_token" ("authorization_code_id")`
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_oauth_consent" (
        "id"                         TEXT        NOT NULL,
        "client_id"                  TEXT        NOT NULL,
        "user_id"                    TEXT,
        "reference_id"               TEXT,
        "resources"                  JSONB,
        "requested_user_info_claims" JSONB,
        "scopes"                     JSONB       NOT NULL,
        "created_at"                 TIMESTAMPTZ NOT NULL,
        "updated_at"                 TIMESTAMPTZ NOT NULL,
        CONSTRAINT "PK_auth_oauth_consent" PRIMARY KEY ("id"),
        CONSTRAINT "FK_auth_oauth_consent_client" FOREIGN KEY ("client_id") REFERENCES "auth_oauth_client" ("client_id") ON DELETE CASCADE,
        CONSTRAINT "FK_auth_oauth_consent_user" FOREIGN KEY ("user_id") REFERENCES "auth_user" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_consent_client_id" ON "auth_oauth_consent" ("client_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_oauth_consent_user_id" ON "auth_oauth_consent" ("user_id")`
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_oauth_client_assertion" (
        "id"         TEXT        NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        CONSTRAINT "PK_auth_oauth_client_assertion" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_oauth_client_assertion"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_oauth_consent"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_oauth_access_token"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_oauth_refresh_token"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_oauth_client_resource"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_oauth_resource"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_oauth_client"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_jwks"`);
  }
}
