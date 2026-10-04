import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1791072000000 implements MigrationInterface {
  name = 'CreateAuthTables1791072000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_user" (
        "id"             TEXT        NOT NULL,
        "name"           TEXT        NOT NULL,
        "email"          TEXT        NOT NULL,
        "email_verified" BOOLEAN     NOT NULL DEFAULT FALSE,
        "image"          TEXT,
        "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_user" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_auth_user_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_session" (
        "id"         TEXT        NOT NULL,
        "token"      TEXT        NOT NULL,
        "user_id"    TEXT        NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "ip_address" TEXT,
        "user_agent" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_session" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_auth_session_token" UNIQUE ("token"),
        CONSTRAINT "FK_auth_session_user" FOREIGN KEY ("user_id") REFERENCES "auth_user" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_auth_session_user_id" ON "auth_session" ("user_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_account" (
        "id"                       TEXT        NOT NULL,
        "account_id"               TEXT        NOT NULL,
        "provider_id"              TEXT        NOT NULL,
        "user_id"                  TEXT        NOT NULL,
        "access_token"             TEXT,
        "refresh_token"            TEXT,
        "id_token"                 TEXT,
        "access_token_expires_at"  TIMESTAMPTZ,
        "refresh_token_expires_at" TIMESTAMPTZ,
        "scope"                    TEXT,
        "password"                 TEXT,
        "created_at"               TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"               TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_account" PRIMARY KEY ("id"),
        CONSTRAINT "FK_auth_account_user" FOREIGN KEY ("user_id") REFERENCES "auth_user" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_auth_account_user_id" ON "auth_account" ("user_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_verification" (
        "id"         TEXT        NOT NULL,
        "identifier" TEXT        NOT NULL,
        "value"      TEXT        NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_verification" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_verification_identifier" ON "auth_verification" ("identifier")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_verification"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_account"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_session"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_user"`);
  }
}
