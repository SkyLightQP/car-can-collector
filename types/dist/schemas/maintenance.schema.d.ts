import { z } from 'zod';
export declare const maintenanceTypeSchema: z.ZodEnum<{
    engine_oil: "engine_oil";
    brake_pad: "brake_pad";
    brake_fluid: "brake_fluid";
    other: "other";
}>;
export type MaintenanceType = z.infer<typeof maintenanceTypeSchema>;
export declare const scheduledMaintenanceTypeSchema: z.ZodEnum<{
    engine_oil: "engine_oil";
    brake_pad: "brake_pad";
    brake_fluid: "brake_fluid";
}>;
export type ScheduledMaintenanceType = z.infer<typeof scheduledMaintenanceTypeSchema>;
export declare const createMaintenanceRecordInputSchema: z.ZodObject<{
    type: z.ZodEnum<{
        engine_oil: "engine_oil";
        brake_pad: "brake_pad";
        brake_fluid: "brake_fluid";
        other: "other";
    }>;
    item: z.ZodString;
    performedOn: z.ZodISODate;
    odometerKm: z.ZodInt32;
    costKrw: z.ZodInt32;
    note: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type CreateMaintenanceRecordInput = z.infer<typeof createMaintenanceRecordInputSchema>;
export declare const updateMaintenanceRecordInputSchema: z.ZodObject<{
    type: z.ZodEnum<{
        engine_oil: "engine_oil";
        brake_pad: "brake_pad";
        brake_fluid: "brake_fluid";
        other: "other";
    }>;
    item: z.ZodString;
    performedOn: z.ZodISODate;
    odometerKm: z.ZodInt32;
    costKrw: z.ZodInt32;
    note: z.ZodDefault<z.ZodString>;
    id: z.ZodUUID;
}, z.core.$strip>;
export type UpdateMaintenanceRecordInput = z.infer<typeof updateMaintenanceRecordInputSchema>;
export declare const deleteMaintenanceRecordInputSchema: z.ZodObject<{
    id: z.ZodUUID;
}, z.core.$strip>;
export type DeleteMaintenanceRecordInput = z.infer<typeof deleteMaintenanceRecordInputSchema>;
export declare const maintenanceRecordSchema: z.ZodObject<{
    id: z.ZodUUID;
    type: z.ZodEnum<{
        engine_oil: "engine_oil";
        brake_pad: "brake_pad";
        brake_fluid: "brake_fluid";
        other: "other";
    }>;
    item: z.ZodString;
    performedOn: z.ZodISODate;
    odometerKm: z.ZodInt;
    costKrw: z.ZodInt;
    note: z.ZodString;
}, z.core.$strip>;
export type MaintenanceRecordView = z.infer<typeof maintenanceRecordSchema>;
export declare const maintenanceRecordsSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodUUID;
    type: z.ZodEnum<{
        engine_oil: "engine_oil";
        brake_pad: "brake_pad";
        brake_fluid: "brake_fluid";
        other: "other";
    }>;
    item: z.ZodString;
    performedOn: z.ZodISODate;
    odometerKm: z.ZodInt;
    costKrw: z.ZodInt;
    note: z.ZodString;
}, z.core.$strip>>;
export declare const maintenanceScheduleSchema: z.ZodObject<{
    type: z.ZodEnum<{
        engine_oil: "engine_oil";
        brake_pad: "brake_pad";
        brake_fluid: "brake_fluid";
    }>;
    intervalKm: z.ZodInt32;
    warningKm: z.ZodInt32;
    enabled: z.ZodBoolean;
}, z.core.$strip>;
export type MaintenanceScheduleView = z.infer<typeof maintenanceScheduleSchema>;
export type UpdateMaintenanceScheduleInput = MaintenanceScheduleView;
export declare const maintenanceSchedulesSchema: z.ZodArray<z.ZodObject<{
    type: z.ZodEnum<{
        engine_oil: "engine_oil";
        brake_pad: "brake_pad";
        brake_fluid: "brake_fluid";
    }>;
    intervalKm: z.ZodInt32;
    warningKm: z.ZodInt32;
    enabled: z.ZodBoolean;
}, z.core.$strip>>;
export declare const maintenanceStatusSchema: z.ZodEnum<{
    normal: "normal";
    warning: "warning";
    critical: "critical";
}>;
export type MaintenanceStatus = z.infer<typeof maintenanceStatusSchema>;
export declare const maintenanceAlertSchema: z.ZodObject<{
    type: z.ZodEnum<{
        engine_oil: "engine_oil";
        brake_pad: "brake_pad";
        brake_fluid: "brake_fluid";
    }>;
    intervalKm: z.ZodInt;
    warningKm: z.ZodInt;
    lastRecord: z.ZodNullable<z.ZodObject<{
        id: z.ZodUUID;
        performedOn: z.ZodISODate;
        odometerKm: z.ZodInt;
    }, z.core.$strip>>;
    dueAtKm: z.ZodNullable<z.ZodInt>;
    remainingKm: z.ZodNullable<z.ZodInt>;
    status: z.ZodNullable<z.ZodEnum<{
        normal: "normal";
        warning: "warning";
        critical: "critical";
    }>>;
}, z.core.$strip>;
export type MaintenanceAlert = z.infer<typeof maintenanceAlertSchema>;
export declare const maintenanceAlertsSchema: z.ZodObject<{
    currentOdometerKm: z.ZodNullable<z.ZodInt>;
    alerts: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            engine_oil: "engine_oil";
            brake_pad: "brake_pad";
            brake_fluid: "brake_fluid";
        }>;
        intervalKm: z.ZodInt;
        warningKm: z.ZodInt;
        lastRecord: z.ZodNullable<z.ZodObject<{
            id: z.ZodUUID;
            performedOn: z.ZodISODate;
            odometerKm: z.ZodInt;
        }, z.core.$strip>>;
        dueAtKm: z.ZodNullable<z.ZodInt>;
        remainingKm: z.ZodNullable<z.ZodInt>;
        status: z.ZodNullable<z.ZodEnum<{
            normal: "normal";
            warning: "warning";
            critical: "critical";
        }>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type MaintenanceAlerts = z.infer<typeof maintenanceAlertsSchema>;
