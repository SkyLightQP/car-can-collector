import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMaintenanceTables1790726400000 implements MigrationInterface {
  name = 'CreateMaintenanceTables1790726400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "maintenance_record" (
        "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
        "type"         TEXT        NOT NULL,
        "item"         TEXT        NOT NULL,
        "performed_on" DATE        NOT NULL,
        "odometer_km"  INTEGER     NOT NULL,
        "cost_krw"     INTEGER     NOT NULL,
        "note"         TEXT        NOT NULL DEFAULT '',
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_maintenance_record" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_maintenance_record_type"
          CHECK ("type" IN ('engine_oil', 'brake_pad', 'brake_fluid', 'other')),
        CONSTRAINT "CHK_maintenance_record_odometer_km" CHECK ("odometer_km" >= 0),
        CONSTRAINT "CHK_maintenance_record_cost_krw" CHECK ("cost_krw" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_maintenance_record_type_odometer_km"
      ON "maintenance_record" ("type", "odometer_km" DESC)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "maintenance_schedule" (
        "type"        TEXT        NOT NULL,
        "interval_km" INTEGER     NOT NULL,
        "warning_km"  INTEGER     NOT NULL,
        "enabled"     BOOLEAN     NOT NULL DEFAULT TRUE,
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_maintenance_schedule" PRIMARY KEY ("type"),
        CONSTRAINT "CHK_maintenance_schedule_type"
          CHECK ("type" IN ('engine_oil', 'brake_pad', 'brake_fluid')),
        CONSTRAINT "CHK_maintenance_schedule_interval_km" CHECK ("interval_km" >= 1),
        CONSTRAINT "CHK_maintenance_schedule_warning_km" CHECK ("warning_km" >= 0 AND "warning_km" <= "interval_km")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "maintenance_schedule" ("type", "interval_km", "warning_km") VALUES
        ('engine_oil',  10000, 1500),
        ('brake_pad',   20000, 3000),
        ('brake_fluid', 40000, 5000)
      ON CONFLICT ("type") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "maintenance_schedule"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_maintenance_record_type_odometer_km"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "maintenance_record"`);
  }
}
