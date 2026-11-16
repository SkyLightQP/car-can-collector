import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiKeyTable1794873600000 implements MigrationInterface {
  name = 'CreateApiKeyTable1794873600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "api_key" (
        "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
        "name"       TEXT        NOT NULL,
        "key_hash"   TEXT        NOT NULL,
        "key_prefix" TEXT        NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_api_key" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_api_key_key_hash" UNIQUE ("key_hash")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "api_key"`);
  }
}
