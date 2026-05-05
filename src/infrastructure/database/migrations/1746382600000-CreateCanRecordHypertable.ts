import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCanRecordHypertable1746382600000 implements MigrationInterface {
  name = 'CreateCanRecordHypertable1746382600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS timescaledb`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "can_record" (
        "time"               TIMESTAMPTZ NOT NULL,
        "device_id"          TEXT        NOT NULL,
        "odometer_km"        REAL        NOT NULL,
        "vehicle_speed_kph"  REAL        NOT NULL,
        "engine_rpm"         REAL        NOT NULL,
        "tpms"               TEXT        NOT NULL,
        "ambient_temp_c"     REAL        NOT NULL,
        "drive_mode"         TEXT        NOT NULL,
        "coolant_temp_c"     REAL        NOT NULL,
        "steering_angle_deg" REAL        NOT NULL,
        "battery_voltage_v"  REAL        NOT NULL,
        CONSTRAINT "PK_can_record" PRIMARY KEY ("time", "device_id")
      )
    `);

    await queryRunner.query(`
      SELECT create_hypertable(
        'can_record',
        'time',
        chunk_time_interval => INTERVAL '1 day',
        if_not_exists => TRUE,
        create_default_indexes => FALSE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_can_record_device_id_time"
      ON "can_record" ("device_id", "time" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_can_record_device_id_time"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "can_record"`);
  }
}
