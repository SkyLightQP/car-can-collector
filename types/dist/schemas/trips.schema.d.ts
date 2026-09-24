import { z } from 'zod';
export declare const DAILY_TRIPS_MAX_DAYS = 92;
export declare const dailyTripsInputSchema: z.ZodObject<{
    from: z.ZodISODate;
    to: z.ZodISODate;
}, z.core.$strip>;
export type DailyTripsInput = z.infer<typeof dailyTripsInputSchema>;
export declare const dailyTripsSchema: z.ZodArray<z.ZodObject<{
    date: z.ZodISODate;
    distanceKm: z.ZodNumber;
    avgSpeedKph: z.ZodNumber;
    maxSpeedKph: z.ZodNumber;
    drivingMinutes: z.ZodInt;
}, z.core.$strip>>;
export type DailyTrips = z.infer<typeof dailyTripsSchema>;
export type DailyTrip = DailyTrips[number];
export declare const lastTripSchema: z.ZodObject<{
    startedAt: z.ZodISODateTime;
    endedAt: z.ZodISODateTime;
    distanceKm: z.ZodNumber;
    maxSpeedKph: z.ZodNumber;
    avgSpeedKph: z.ZodNumber;
    durationMinutes: z.ZodInt;
}, z.core.$strip>;
export type LastTrip = z.infer<typeof lastTripSchema>;
export declare const weeklyTripsInputSchema: z.ZodPrefault<z.ZodObject<{
    weeks: z.ZodDefault<z.ZodInt>;
}, z.core.$strip>>;
export type WeeklyTripsInput = z.infer<typeof weeklyTripsInputSchema>;
export declare const weeklyTripsSchema: z.ZodArray<z.ZodObject<{
    weekStart: z.ZodISODate;
    distanceKm: z.ZodNumber;
    avgSpeedKph: z.ZodNumber;
    drivingMinutes: z.ZodInt;
}, z.core.$strip>>;
export type WeeklyTrips = z.infer<typeof weeklyTripsSchema>;
export type WeeklyTrip = WeeklyTrips[number];
