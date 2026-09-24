import { Injectable } from '@nestjs/common';
import { CanRecordRepository, type DrivingBucketRow } from '@infrastructure/repository/can-record.repository';
import type { TripQueries } from '@app/trpc/routers/trips.router';
import type {
  DailyTrips,
  DailyTripsInput,
  LastTrip,
  WeeklyTrips,
  WeeklyTripsInput,
} from '@app/trpc/schemas/trips.schema';
import { addDays, dateRange, kstMidnight, kstToday, mondayOf } from './kst-date';
import { averageSpeedKph, round1, toMinutes } from './driving-stats';

function fillEmptyBuckets(bucketKeys: string[], rows: DrivingBucketRow[]): DrivingBucketRow[] {
  const rowByBucket = new Map(rows.map((row) => [row.bucket, row]));
  return bucketKeys.map(
    (bucket) => rowByBucket.get(bucket) ?? { bucket, distanceKm: 0, maxSpeedKph: 0, drivingSeconds: 0 }
  );
}

@Injectable()
export class TripQueryService implements TripQueries {
  constructor(private readonly canRecordRepository: CanRecordRepository) {}

  async getDaily({ from, to }: DailyTripsInput): Promise<DailyTrips> {
    const rows = await this.canRecordRepository.aggregateDriving(kstMidnight(from), kstMidnight(addDays(to, 1)), 'day');

    return fillEmptyBuckets(dateRange(from, to), rows).map((day) => ({
      date: day.bucket,
      distanceKm: round1(day.distanceKm),
      avgSpeedKph: averageSpeedKph(day.distanceKm, day.drivingSeconds),
      maxSpeedKph: round1(day.maxSpeedKph),
      drivingMinutes: toMinutes(day.drivingSeconds),
    }));
  }

  async getWeekly({ weeks }: WeeklyTripsInput): Promise<WeeklyTrips> {
    const thisWeek = mondayOf(kstToday(new Date()));
    const firstWeek = addDays(thisWeek, -7 * (weeks - 1));
    const rows = await this.canRecordRepository.aggregateDriving(
      kstMidnight(firstWeek),
      kstMidnight(addDays(thisWeek, 7)),
      'week'
    );
    const weekStarts = Array.from({ length: weeks }, (_, i) => addDays(firstWeek, 7 * i));

    return fillEmptyBuckets(weekStarts, rows).map((week) => ({
      weekStart: week.bucket,
      distanceKm: round1(week.distanceKm),
      avgSpeedKph: averageSpeedKph(week.distanceKm, week.drivingSeconds),
      drivingMinutes: toMinutes(week.drivingSeconds),
    }));
  }

  async getLast(): Promise<LastTrip | null> {
    const session = await this.canRecordRepository.findLastSession();
    if (!session) return null;

    return {
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt.toISOString(),
      distanceKm: round1(session.distanceKm),
      maxSpeedKph: round1(session.maxSpeedKph),
      avgSpeedKph: averageSpeedKph(session.distanceKm, session.drivingSeconds),
      durationMinutes: toMinutes(session.drivingSeconds),
    };
  }
}
