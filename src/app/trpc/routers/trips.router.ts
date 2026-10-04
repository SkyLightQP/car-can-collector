import { protectedProcedure, router } from '../trpc';
import {
  type DailyTrips,
  type DailyTripsInput,
  dailyTripsInputSchema,
  dailyTripsSchema,
  type LastTrip,
  lastTripSchema,
  type WeeklyTrips,
  type WeeklyTripsInput,
  weeklyTripsInputSchema,
  weeklyTripsSchema,
} from '../schemas/trips.schema';

export interface TripQueries {
  getDaily(input: DailyTripsInput): Promise<DailyTrips>;
  getLast(): Promise<LastTrip | null>;
  getWeekly(input: WeeklyTripsInput): Promise<WeeklyTrips>;
}

export function createTripsRouter(queries: TripQueries) {
  return router({
    daily: protectedProcedure
      .input(dailyTripsInputSchema)
      .output(dailyTripsSchema)
      .query(({ input }) => queries.getDaily(input)),
    last: protectedProcedure.output(lastTripSchema.nullable()).query(() => queries.getLast()),
    weekly: protectedProcedure
      .input(weeklyTripsInputSchema)
      .output(weeklyTripsSchema)
      .query(({ input }) => queries.getWeekly(input)),
  });
}
