import { type DailyTrips, type DailyTripsInput, type LastTrip, type WeeklyTrips, type WeeklyTripsInput } from '../schemas/trips.schema';
export interface TripQueries {
    getDaily(input: DailyTripsInput): Promise<DailyTrips>;
    getLast(): Promise<LastTrip | null>;
    getWeekly(input: WeeklyTripsInput): Promise<WeeklyTrips>;
}
export declare function createTripsRouter(queries: TripQueries): import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../trpc").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    daily: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from: string;
            to: string;
        };
        output: {
            date: string;
            distanceKm: number;
            avgSpeedKph: number;
            maxSpeedKph: number;
            drivingMinutes: number;
        }[];
        meta: object;
    }>;
    last: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            startedAt: string;
            endedAt: string;
            distanceKm: number;
            maxSpeedKph: number;
            avgSpeedKph: number;
            durationMinutes: number;
        } | null;
        meta: object;
    }>;
    weekly: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            weeks?: number | undefined;
        } | undefined;
        output: {
            weekStart: string;
            distanceKm: number;
            avgSpeedKph: number;
            drivingMinutes: number;
        }[];
        meta: object;
    }>;
}>>;
