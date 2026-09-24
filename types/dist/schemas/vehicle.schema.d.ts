import { z } from 'zod';
export declare const vehicleStatusSchema: z.ZodObject<{
    measuredAt: z.ZodISODateTime;
    engineOn: z.ZodBoolean;
    odometerKm: z.ZodNumber;
    batteryVoltageV: z.ZodNullable<z.ZodNumber>;
    tires: z.ZodObject<{
        frontLeft: z.ZodNullable<z.ZodNumber>;
        frontRight: z.ZodNullable<z.ZodNumber>;
        rearLeft: z.ZodNullable<z.ZodNumber>;
        rearRight: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>;
    tpmsWarnLamp: z.ZodBoolean;
    tpmsStatus: z.ZodString;
}, z.core.$strip>;
export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;
export declare const batteryHistoryInputSchema: z.ZodPrefault<z.ZodObject<{
    days: z.ZodDefault<z.ZodInt>;
}, z.core.$strip>>;
export type BatteryHistoryInput = z.infer<typeof batteryHistoryInputSchema>;
export declare const batteryHistorySchema: z.ZodArray<z.ZodObject<{
    date: z.ZodISODate;
    voltageV: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>>;
export type BatteryHistory = z.infer<typeof batteryHistorySchema>;
