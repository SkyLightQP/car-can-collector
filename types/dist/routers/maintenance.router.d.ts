import { type CreateMaintenanceRecordInput, type DeleteMaintenanceRecordInput, type MaintenanceAlerts, type MaintenanceRecordView, type MaintenanceScheduleView, type UpdateMaintenanceRecordInput, type UpdateMaintenanceScheduleInput } from '../schemas/maintenance.schema';
export interface MaintenanceOperations {
    getAlerts(): Promise<MaintenanceAlerts>;
    listRecords(): Promise<MaintenanceRecordView[]>;
    createRecord(input: CreateMaintenanceRecordInput): Promise<MaintenanceRecordView>;
    updateRecord(input: UpdateMaintenanceRecordInput): Promise<MaintenanceRecordView | null>;
    deleteRecord(input: DeleteMaintenanceRecordInput): Promise<DeleteMaintenanceRecordInput | null>;
    listSchedules(): Promise<MaintenanceScheduleView[]>;
    updateSchedule(input: UpdateMaintenanceScheduleInput): Promise<MaintenanceScheduleView | null>;
}
export declare function createMaintenanceRouter(operations: MaintenanceOperations): import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../trpc").Context;
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
        ctx: import("../trpc").Context;
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
        ctx: import("../trpc").Context;
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
