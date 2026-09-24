import { type BatteryHistory, type BatteryHistoryInput, type VehicleStatus } from '../schemas/vehicle.schema';
export interface VehicleQueries {
    getStatus(): Promise<VehicleStatus | null>;
    getBatteryHistory(input: BatteryHistoryInput): Promise<BatteryHistory>;
}
export declare function createVehicleRouter(queries: VehicleQueries): import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../trpc").Context;
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
