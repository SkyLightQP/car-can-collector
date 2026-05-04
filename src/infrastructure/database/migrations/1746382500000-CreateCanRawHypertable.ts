import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCanRawHypertable1746382500000 implements MigrationInterface {
  name = 'CreateCanRawHypertable1746382500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS timescaledb`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "can_raw" (
        "time" TIMESTAMPTZ NOT NULL,
        "device_id" TEXT NOT NULL,
        "can_id" INTEGER NOT NULL,
        "dlc" SMALLINT NOT NULL,
        "data" BYTEA NOT NULL,
        CONSTRAINT "PK_can_raw" PRIMARY KEY ("time", "device_id", "can_id")
      )
    `);

    await queryRunner.query(`
      SELECT create_hypertable(
        'can_raw',
        'time',
        chunk_time_interval => INTERVAL '1 day',
        if_not_exists => TRUE,
        create_default_indexes => FALSE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_can_raw_device_id_time"
      ON "can_raw" ("device_id", "time" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_can_raw_can_id_time"
      ON "can_raw" ("can_id", "time" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_can_raw_can_id_time"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_can_raw_device_id_time"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "can_raw"`);
  }
}
