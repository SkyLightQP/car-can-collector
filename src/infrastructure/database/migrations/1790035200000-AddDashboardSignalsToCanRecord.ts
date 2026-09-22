import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 대시보드 목업이 요구하는 신호를 can_record 에 추가한다.
 *
 * - TPMS: 'FL#FR#RL#RR' 텍스트 한 칸 → 휠별 숫자 컬럼 + 경고등/센서 상태
 * - cluster_speed_kph: CLU11 클러스터 표시 속도 (0.5km/h 단위)
 * - engine_on: 주행 시간·트립 경계 계산용 시동 플래그
 */
export class AddDashboardSignalsToCanRecord1790035200000 implements MigrationInterface {
  name = 'AddDashboardSignalsToCanRecord1790035200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "can_record"
        ADD COLUMN IF NOT EXISTS "cluster_speed_kph" REAL    NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "engine_on"         BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "tpms_fl_psi"       REAL,
        ADD COLUMN IF NOT EXISTS "tpms_fr_psi"       REAL,
        ADD COLUMN IF NOT EXISTS "tpms_rl_psi"       REAL,
        ADD COLUMN IF NOT EXISTS "tpms_rr_psi"       REAL,
        ADD COLUMN IF NOT EXISTS "tpms_warn_lamp"    BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "tpms_status"       TEXT    NOT NULL DEFAULT 'Unknown'
    `);

    // 기존 tpms 텍스트를 휠별 컬럼으로 옮긴다.
    // 'N/A'(센서 미수신)와 0(첫 0x593 수신 전 초기값)은 유효한 압력이 아니므로 NULL 로 남긴다.
    await queryRunner.query(`
      UPDATE "can_record" SET
        "tpms_fl_psi" = CASE WHEN split_part("tpms", '#', 1) ~ '^[0-9]+$' THEN NULLIF(split_part("tpms", '#', 1)::real, 0) END,
        "tpms_fr_psi" = CASE WHEN split_part("tpms", '#', 2) ~ '^[0-9]+$' THEN NULLIF(split_part("tpms", '#', 2)::real, 0) END,
        "tpms_rl_psi" = CASE WHEN split_part("tpms", '#', 3) ~ '^[0-9]+$' THEN NULLIF(split_part("tpms", '#', 3)::real, 0) END,
        "tpms_rr_psi" = CASE WHEN split_part("tpms", '#', 4) ~ '^[0-9]+$' THEN NULLIF(split_part("tpms", '#', 4)::real, 0) END
      WHERE "tpms" IS NOT NULL
    `);

    await queryRunner.query(`ALTER TABLE "can_record" DROP COLUMN IF EXISTS "tpms"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "can_record"
        ADD COLUMN IF NOT EXISTS "tpms" TEXT NOT NULL DEFAULT '0#0#0#0'
    `);

    await queryRunner.query(`
      UPDATE "can_record" SET "tpms" =
        concat_ws('#',
          COALESCE("tpms_fl_psi"::int::text, 'N/A'),
          COALESCE("tpms_fr_psi"::int::text, 'N/A'),
          COALESCE("tpms_rl_psi"::int::text, 'N/A'),
          COALESCE("tpms_rr_psi"::int::text, 'N/A')
        )
    `);

    await queryRunner.query(`
      ALTER TABLE "can_record"
        DROP COLUMN IF EXISTS "cluster_speed_kph",
        DROP COLUMN IF EXISTS "engine_on",
        DROP COLUMN IF EXISTS "tpms_fl_psi",
        DROP COLUMN IF EXISTS "tpms_fr_psi",
        DROP COLUMN IF EXISTS "tpms_rl_psi",
        DROP COLUMN IF EXISTS "tpms_rr_psi",
        DROP COLUMN IF EXISTS "tpms_warn_lamp",
        DROP COLUMN IF EXISTS "tpms_status"
    `);
  }
}
