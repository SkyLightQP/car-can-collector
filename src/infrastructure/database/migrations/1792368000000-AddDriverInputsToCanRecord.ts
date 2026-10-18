import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDriverInputsToCanRecord1792368000000 implements MigrationInterface {
  name = 'AddDriverInputsToCanRecord1792368000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "can_record"
        ADD COLUMN IF NOT EXISTS "accel_pedal_pct"    REAL    NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "brake_pressure_bar" REAL    NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "brake_active"       BOOLEAN NOT NULL DEFAULT FALSE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "can_record"
        DROP COLUMN IF EXISTS "accel_pedal_pct",
        DROP COLUMN IF EXISTS "brake_pressure_bar",
        DROP COLUMN IF EXISTS "brake_active"
    `);
  }
}
