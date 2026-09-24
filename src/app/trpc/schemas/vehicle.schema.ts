import { z } from 'zod';

export const vehicleStatusSchema = z.object({
  measuredAt: z.iso.datetime(),
  engineOn: z.boolean(),
  odometerKm: z.number(),
  batteryVoltageV: z.number().nullable(),
  tires: z.object({
    frontLeft: z.number().nullable(),
    frontRight: z.number().nullable(),
    rearLeft: z.number().nullable(),
    rearRight: z.number().nullable(),
  }),
  tpmsWarnLamp: z.boolean(),
  tpmsStatus: z.string(),
});
export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;

export const batteryHistoryInputSchema = z
  .object({
    days: z.int().min(1).max(90).default(7),
  })
  .prefault({});
export type BatteryHistoryInput = z.infer<typeof batteryHistoryInputSchema>;

export const batteryHistorySchema = z.array(
  z.object({
    date: z.iso.date(),
    voltageV: z.number().nullable(),
  })
);
export type BatteryHistory = z.infer<typeof batteryHistorySchema>;
