import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CanRecord } from '@app/domain/can-record';
import { CanRecordEntity } from '@infrastructure/database/entities/can-record.entity';

export interface DailyVoltageRow {
  date: string;
  voltageV: number;
}

export type DrivingBucketUnit = 'day' | 'week';

export interface DrivingBucketRow {
  bucket: string;
  distanceKm: number;
  maxSpeedKph: number;
  avgSpeedKph: number;
  drivingSeconds: number;
}

export interface DrivingSessionRow {
  startedAt: Date;
  endedAt: Date;
  distanceKm: number;
  maxSpeedKph: number;
  avgSpeedKph: number;
  drivingSeconds: number;
}

const SESSION_GAP_SECONDS = 300;
const LAST_SESSION_LOOKBACK = '24 hours';

@Injectable()
export class CanRecordRepository {
  constructor(
    @InjectRepository(CanRecordEntity)
    private readonly repo: Repository<CanRecordEntity>
  ) {}

  async saveAll(records: CanRecord[]): Promise<void> {
    if (records.length === 0) return;
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(CanRecordEntity)
      .values(records.map((r) => CanRecordEntity.fromDomain(r)))
      .orIgnore()
      .execute();
  }

  async findLatestPerDevice(): Promise<CanRecord[]> {
    const entities = await this.repo
      .createQueryBuilder('r')
      .distinctOn(['r.deviceId'])
      .orderBy('r.deviceId', 'ASC')
      .addOrderBy('r.timestamp', 'DESC')
      .getMany();

    return entities.map((e) => e.toDomain());
  }

  async findLatest(): Promise<CanRecord | null> {
    const entity = await this.repo.createQueryBuilder('r').orderBy('r.timestamp', 'DESC').limit(1).getOne();
    return entity?.toDomain() ?? null;
  }

  async findDailyRunningVoltage(from: Date, to: Date): Promise<DailyVoltageRow[]> {
    return this.repo.query<DailyVoltageRow[]>(
      `
      SELECT to_char((time AT TIME ZONE 'Asia/Seoul')::date, 'YYYY-MM-DD') AS "date",
             AVG(battery_voltage_v)::float8                               AS "voltageV"
      FROM can_record
      WHERE time >= $1::timestamptz
        AND time < $2::timestamptz
        AND engine_rpm > 0
        AND battery_voltage_v > 0
      GROUP BY 1
      ORDER BY 1
      `,
      [from, to]
    );
  }

  async aggregateDriving(from: Date, to: Date, unit: DrivingBucketUnit): Promise<DrivingBucketRow[]> {
    return this.repo.query<DrivingBucketRow[]>(
      `
      WITH driving AS (
        SELECT time,
               EXTRACT(EPOCH FROM time - LAG(time) OVER (ORDER BY time))::float8 AS gap_s
        FROM can_record
        WHERE engine_rpm > 0
          AND time >= $1::timestamptz - INTERVAL '${SESSION_GAP_SECONDS} seconds'
          AND time < $2::timestamptz
      ),
      drive_time AS (
        SELECT date_trunc($3::text, time AT TIME ZONE 'Asia/Seoul') AS bucket,
               SUM(gap_s) FILTER (WHERE gap_s <= ${SESSION_GAP_SECONDS}) AS driving_s
        FROM driving
        WHERE time >= $1::timestamptz
        GROUP BY 1
      ),
      stats AS (
        SELECT date_trunc($3::text, time AT TIME ZONE 'Asia/Seoul') AS bucket,
               MAX(odometer_km) FILTER (WHERE odometer_km > 0)
                 - MIN(odometer_km) FILTER (WHERE odometer_km > 0)   AS distance_km,
               MAX(vehicle_speed_kph)                                AS max_speed_kph,
               AVG(vehicle_speed_kph) FILTER (WHERE vehicle_speed_kph > 0) AS avg_speed_kph
        FROM can_record
        WHERE time >= $1::timestamptz
          AND time < $2::timestamptz
        GROUP BY 1
      )
      SELECT to_char(s.bucket, 'YYYY-MM-DD')        AS "bucket",
             COALESCE(s.distance_km, 0)::float8    AS "distanceKm",
             COALESCE(s.max_speed_kph, 0)::float8  AS "maxSpeedKph",
             COALESCE(s.avg_speed_kph, 0)::float8  AS "avgSpeedKph",
             COALESCE(d.driving_s, 0)::float8      AS "drivingSeconds"
      FROM stats s
      LEFT JOIN drive_time d ON d.bucket = s.bucket
      ORDER BY s.bucket
      `,
      [from, to, unit]
    );
  }

  async findLastSession(): Promise<DrivingSessionRow | null> {
    const rows = await this.repo.query<DrivingSessionRow[]>(
      `
      WITH last AS (
        SELECT MAX(time) AS t FROM can_record WHERE engine_rpm > 0
      ),
      driving AS (
        SELECT r.time, r.odometer_km, r.vehicle_speed_kph,
               EXTRACT(EPOCH FROM r.time - LAG(r.time) OVER (ORDER BY r.time))::float8 AS gap_s
        FROM can_record r, last
        WHERE r.engine_rpm > 0
          AND r.time >= last.t - INTERVAL '${LAST_SESSION_LOOKBACK}'
          AND r.time <= last.t
      ),
      marked AS (
        SELECT *,
               SUM(CASE WHEN gap_s IS NULL OR gap_s > ${SESSION_GAP_SECONDS} THEN 1 ELSE 0 END)
                 OVER (ORDER BY time) AS session_no
        FROM driving
      ),
      last_session AS (
        SELECT * FROM marked WHERE session_no = (SELECT MAX(session_no) FROM marked)
      )
      SELECT MIN(time)                                                                      AS "startedAt",
             MAX(time)                                                                      AS "endedAt",
             COALESCE(MAX(odometer_km) FILTER (WHERE odometer_km > 0)
                        - MIN(odometer_km) FILTER (WHERE odometer_km > 0), 0)::float8       AS "distanceKm",
             COALESCE(MAX(vehicle_speed_kph), 0)::float8                                    AS "maxSpeedKph",
             COALESCE(AVG(vehicle_speed_kph) FILTER (WHERE vehicle_speed_kph > 0), 0)::float8 AS "avgSpeedKph",
             COALESCE(SUM(gap_s) FILTER (WHERE gap_s <= ${SESSION_GAP_SECONDS}), 0)::float8 AS "drivingSeconds"
      FROM last_session
      HAVING COUNT(*) > 0
      `
    );
    return rows[0] ?? null;
  }
}
