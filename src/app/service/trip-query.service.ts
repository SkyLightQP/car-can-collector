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

const EMPTY_BUCKET: Omit<DrivingBucketRow, 'bucket'> = { distanceKm: 0, maxSpeedKph: 0, drivingSeconds: 0 };

@Injectable()
export class TripQueryService implements TripQueries {
  constructor(private readonly canRecordRepository: CanRecordRepository) {}

  async getDaily({ from, to }: DailyTripsInput): Promise<DailyTrips> {
    const rows = await this.canRecordRepository.aggregateDriving(kstMidnight(from), kstMidnight(addDays(to, 1)), 'day');
    const rowByDate = new Map(rows.map((row) => [row.bucket, row]));

    return dateRange(from, to).map((date) => {
      const row = rowByDate.get(date) ?? EMPTY_BUCKET;
      return {
        date,
        distanceKm: round1(row.distanceKm),
        avgSpeedKph: averageSpeedKph(row.distanceKm, row.drivingSeconds),
        maxSpeedKph: round1(row.maxSpeedKph),
        drivingMinutes: toMinutes(row.drivingSeconds),
      };
    });
  }

  async getWeekly({ weeks }: WeeklyTripsInput): Promise<WeeklyTrips> {
    const thisWeek = mondayOf(kstToday(new Date()));
    const firstWeek = addDays(thisWeek, -7 * (weeks - 1));
    const rows = await this.canRecordRepository.aggregateDriving(
      kstMidnight(firstWeek),
      kstMidnight(addDays(thisWeek, 7)),
      'week'
    );
    const rowByWeek = new Map(rows.map((row) => [row.bucket, row]));

    return Array.from({ length: weeks }, (_, i) => addDays(firstWeek, 7 * i)).map((weekStart) => {
      const row = rowByWeek.get(weekStart) ?? EMPTY_BUCKET;
      return {
        weekStart,
        distanceKm: round1(row.distanceKm),
        avgSpeedKph: averageSpeedKph(row.distanceKm, row.drivingSeconds),
        drivingMinutes: toMinutes(row.drivingSeconds),
      };
    });
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
