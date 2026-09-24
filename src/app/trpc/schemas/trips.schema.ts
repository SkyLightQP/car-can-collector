import { z } from 'zod';

const DAY_MS = 24 * 60 * 60 * 1000;

export const DAILY_TRIPS_MAX_DAYS = 92;

export const dailyTripsInputSchema = z
  .object({
    from: z.iso.date(),
    to: z.iso.date(),
  })
  .refine(({ from, to }) => from <= to, { error: 'from 은 to 보다 늦을 수 없다', path: ['from'] })
  .refine(({ from, to }) => (Date.parse(to) - Date.parse(from)) / DAY_MS + 1 <= DAILY_TRIPS_MAX_DAYS, {
    error: `조회 기간은 최대 ${DAILY_TRIPS_MAX_DAYS}일이다`,
    path: ['to'],
  });
export type DailyTripsInput = z.infer<typeof dailyTripsInputSchema>;

export const dailyTripsSchema = z.array(
  z.object({
    date: z.iso.date(),
    distanceKm: z.number(),
    avgSpeedKph: z.number(),
    maxSpeedKph: z.number(),
    drivingMinutes: z.int(),
  })
);
export type DailyTrips = z.infer<typeof dailyTripsSchema>;
export type DailyTrip = DailyTrips[number];

export const lastTripSchema = z.object({
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  distanceKm: z.number(),
  maxSpeedKph: z.number(),
  avgSpeedKph: z.number(),
  durationMinutes: z.int(),
});
export type LastTrip = z.infer<typeof lastTripSchema>;

export const weeklyTripsInputSchema = z
  .object({
    weeks: z.int().min(1).max(26).default(6),
  })
  .prefault({});
export type WeeklyTripsInput = z.infer<typeof weeklyTripsInputSchema>;

export const weeklyTripsSchema = z.array(
  z.object({
    weekStart: z.iso.date(),
    distanceKm: z.number(),
    avgSpeedKph: z.number(),
    drivingMinutes: z.int(),
  })
);
export type WeeklyTrips = z.infer<typeof weeklyTripsSchema>;
export type WeeklyTrip = WeeklyTrips[number];
