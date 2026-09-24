import { type TripQueries } from './routers/trips.router';
import { type VehicleQueries } from './routers/vehicle.router';
export interface AppRouterDeps {
    vehicle: VehicleQueries;
    trips: TripQueries;
}
export declare function createAppRouter(deps: AppRouterDeps): import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("./trpc").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    vehicle: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("./trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        status: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                measuredAt: string;
                engineOn: boolean;
                odometerKm: number;
                batteryVoltageV: number | null;
                tires: {
                    frontLeft: number | null;
                    frontRight: number | null;
                    rearLeft: number | null;
                    rearRight: number | null;
                };
                tpmsWarnLamp: boolean;
                tpmsStatus: string;
            } | null;
            meta: object;
        }>;
        batteryHistory: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                days?: number | undefined;
            } | undefined;
            output: {
                date: string;
                voltageV: number | null;
            }[];
            meta: object;
        }>;
    }>>;
    trips: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("./trpc").Context;
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
}>>;
export type AppRouter = ReturnType<typeof createAppRouter>;
