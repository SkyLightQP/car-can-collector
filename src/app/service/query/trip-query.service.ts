import { Injectable } from '@nestjs/common';
import {
  CanRecordRepository,
  type DriverInputRow,
  type DrivingBucketRow,
  SESSION_GAP_SECONDS,
} from '@infrastructure/repository/can-record.repository';
import type { TripQueries } from '@app/trpc/routers/trips.router';
import type {
  DailyTrips,
  DailyTripsInput,
  DriveReplay,
  DriveReplayInput,
  LastTrip,
  WeeklyTrips,
  WeeklyTripsInput,
} from '@app/trpc/schemas/trips.schema';
import { KstDate } from '@app/domain/kst-date';
import { DrivingStats } from '@app/domain/driving-stats';

@Injectable()
export class TripQueryService implements TripQueries {
  constructor(private readonly canRecordRepository: CanRecordRepository) {}

  async getDaily({ from, to }: DailyTripsInput): Promise<DailyTrips> {
    const firstDay = KstDate.from(from);
    const lastDay = KstDate.from(to);
    const rows = await this.canRecordRepository.aggregateDriving(firstDay.startsAt, lastDay.addDays(1).startsAt, 'day');

    return attachDrivingStats(firstDay.datesThrough(lastDay), rows).map(({ period, stats }) => ({
      date: period.value,
      distanceKm: stats.distanceKm,
      avgSpeedKph: stats.avgSpeedKph,
      maxSpeedKph: stats.maxSpeedKph,
      drivingMinutes: stats.drivingMinutes,
    }));
  }

  async getWeekly({ weeks }: WeeklyTripsInput): Promise<WeeklyTrips> {
    const thisWeek = KstDate.today(new Date()).weekStart;
    const firstWeek = thisWeek.addDays(-7 * (weeks - 1));
    const rows = await this.canRecordRepository.aggregateDriving(
      firstWeek.startsAt,
      thisWeek.addDays(7).startsAt,
      'week'
    );
    const weekStarts = Array.from({ length: weeks }, (_, i) => firstWeek.addDays(7 * i));

    return attachDrivingStats(weekStarts, rows).map(({ period, stats }) => ({
      weekStart: period.value,
      distanceKm: stats.distanceKm,
      avgSpeedKph: stats.avgSpeedKph,
      drivingMinutes: stats.drivingMinutes,
    }));
  }

  async getLast(): Promise<LastTrip | null> {
    const session = await this.canRecordRepository.findLastSession();
    if (!session) return null;

    const stats = DrivingStats.from(session);
    return {
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt.toISOString(),
      distanceKm: stats.distanceKm,
      maxSpeedKph: stats.maxSpeedKph,
      avgSpeedKph: stats.avgSpeedKph,
      durationMinutes: stats.drivingMinutes,
    };
  }

  async getReplay({ range }: DriveReplayInput): Promise<DriveReplay> {
    if (range === 'today') {
      const today = KstDate.today(new Date());
      return splitIntoReplaySessions(
        await this.canRecordRepository.findDriverInputs(today.startsAt, today.addDays(1).startsAt)
      );
    }

    const session = await this.canRecordRepository.findLastSession();
    if (!session) return [];

    const rows = await this.canRecordRepository.findDriverInputs(
      session.startedAt,
      new Date(session.endedAt.getTime() + 1)
    );
    return splitIntoReplaySessions(rows);
  }
}

function attachDrivingStats(periods: KstDate[], rows: DrivingBucketRow[]): { period: KstDate; stats: DrivingStats }[] {
  const rowByBucket = new Map(rows.map((row) => [row.bucket, row]));
  return periods.map((period) => {
    const row = rowByBucket.get(period.value);
    return { period, stats: row ? DrivingStats.from(row) : DrivingStats.empty() };
  });
}

function splitIntoReplaySessions(rows: DriverInputRow[]): DriveReplay {
  const sessions: DriveReplay = [];
  let previousTime: number | null = null;

  for (const row of rows) {
    const time = row.time.getTime();
    if (previousTime === null || time - previousTime > SESSION_GAP_SECONDS * 1000) {
      sessions.push({ startedAt: row.time.toISOString(), endedAt: row.time.toISOString(), points: [] });
    }

    const session = sessions[sessions.length - 1];
    session.endedAt = row.time.toISOString();
    session.points.push({
      t: time,
      speedKph: roundToTenth(row.speedKph),
      accelPct: roundToTenth(row.accelPct),
      brakeBar: roundToTenth(row.brakeBar),
      steeringDeg: roundToTenth(row.steeringDeg),
    });
    previousTime = time;
  }

  return sessions;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
