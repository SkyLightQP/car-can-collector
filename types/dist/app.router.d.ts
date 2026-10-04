import { type MaintenanceOperations } from './routers/maintenance.router';
import { type TripQueries } from './routers/trips.router';
import { type VehicleQueries } from './routers/vehicle.router';
export interface AppRouterDeps {
    vehicle: VehicleQueries;
    trips: TripQueries;
    maintenance: MaintenanceOperations;
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
    maintenance: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("./trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        alerts: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                currentOdometerKm: number | null;
                alerts: {
                    type: "engine_oil" | "brake_pad" | "brake_fluid";
                    intervalKm: number;
                    warningKm: number;
                    lastRecord: {
                        id: string;
                        performedOn: string;
                        odometerKm: number;
                    } | null;
                    dueAtKm: number | null;
                    remainingKm: number | null;
                    status: "normal" | "warning" | "critical" | null;
                }[];
            };
            meta: object;
        }>;
        records: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("./trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: void;
                output: {
                    id: string;
                    type: "engine_oil" | "brake_pad" | "brake_fluid" | "other";
                    item: string;
                    performedOn: string;
                    odometerKm: number;
                    costKrw: number;
                    note: string;
                }[];
                meta: object;
            }>;
            create: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    type: "engine_oil" | "brake_pad" | "brake_fluid" | "other";
                    item: string;
                    performedOn: string;
                    odometerKm: number;
                    costKrw: number;
                    note?: string | undefined;
                };
                output: {
                    id: string;
                    type: "engine_oil" | "brake_pad" | "brake_fluid" | "other";
                    item: string;
                    performedOn: string;
                    odometerKm: number;
                    costKrw: number;
                    note: string;
                };
                meta: object;
            }>;
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    type: "engine_oil" | "brake_pad" | "brake_fluid" | "other";
                    item: string;
                    performedOn: string;
                    odometerKm: number;
                    costKrw: number;
                    id: string;
                    note?: string | undefined;
                };
                output: {
                    id: string;
                    type: "engine_oil" | "brake_pad" | "brake_fluid" | "other";
                    item: string;
                    performedOn: string;
                    odometerKm: number;
                    costKrw: number;
                    note: string;
                };
                meta: object;
            }>;
            delete: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    id: string;
                };
                output: {
                    id: string;
                };
                meta: object;
            }>;
        }>>;
        schedules: import("@trpc/server").TRPCBuiltRouter<{
            ctx: import("./trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").TRPCDefaultErrorShape;
            transformer: false;
        }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
            list: import("@trpc/server").TRPCQueryProcedure<{
                input: void;
                output: {
                    type: "engine_oil" | "brake_pad" | "brake_fluid";
                    intervalKm: number;
                    warningKm: number;
                    enabled: boolean;
                }[];
                meta: object;
            }>;
            update: import("@trpc/server").TRPCMutationProcedure<{
                input: {
                    type: "engine_oil" | "brake_pad" | "brake_fluid";
                    intervalKm: number;
                    warningKm: number;
                    enabled: boolean;
                };
                output: {
                    type: "engine_oil" | "brake_pad" | "brake_fluid";
                    intervalKm: number;
                    warningKm: number;
                    enabled: boolean;
                };
                meta: object;
            }>;
        }>>;
    }>>;
}>>;
export type AppRouter = ReturnType<typeof createAppRouter>;
