import { z } from 'zod';
import { supportedDate } from './supported-date.schema';

export const maintenanceTypeSchema = z.enum(['engine_oil', 'brake_pad', 'brake_fluid', 'other']);
export type MaintenanceType = z.infer<typeof maintenanceTypeSchema>;

export const scheduledMaintenanceTypeSchema = maintenanceTypeSchema.exclude(['other']);
export type ScheduledMaintenanceType = z.infer<typeof scheduledMaintenanceTypeSchema>;

const maintenanceRecordFieldsSchema = z.object({
  type: maintenanceTypeSchema,
  item: z.string().trim().min(1).max(100),
  performedOn: supportedDate,
  odometerKm: z.int32().min(0),
  costKrw: z.int32().min(0),
  note: z.string().trim().max(1000).default(''),
});

export const createMaintenanceRecordInputSchema = maintenanceRecordFieldsSchema;
export type CreateMaintenanceRecordInput = z.infer<typeof createMaintenanceRecordInputSchema>;

export const updateMaintenanceRecordInputSchema = maintenanceRecordFieldsSchema.extend({ id: z.uuid() });
export type UpdateMaintenanceRecordInput = z.infer<typeof updateMaintenanceRecordInputSchema>;

export const deleteMaintenanceRecordInputSchema = z.object({ id: z.uuid() });
export type DeleteMaintenanceRecordInput = z.infer<typeof deleteMaintenanceRecordInputSchema>;

export const maintenanceRecordSchema = z.object({
  id: z.uuid(),
  type: maintenanceTypeSchema,
  item: z.string(),
  performedOn: z.iso.date(),
  odometerKm: z.int(),
  costKrw: z.int(),
  note: z.string(),
});
export type MaintenanceRecordView = z.infer<typeof maintenanceRecordSchema>;

export const maintenanceRecordsSchema = z.array(maintenanceRecordSchema);

export const maintenanceScheduleSchema = z
  .object({
    type: scheduledMaintenanceTypeSchema,
    intervalKm: z.int32().min(1),
    warningKm: z.int32().min(0),
    enabled: z.boolean(),
  })
  .refine(({ intervalKm, warningKm }) => warningKm <= intervalKm, {
    error: 'warningKm 은 intervalKm 보다 클 수 없다',
    path: ['warningKm'],
  });
export type MaintenanceScheduleView = z.infer<typeof maintenanceScheduleSchema>;
export type UpdateMaintenanceScheduleInput = MaintenanceScheduleView;

export const maintenanceSchedulesSchema = z.array(maintenanceScheduleSchema);

export const maintenanceStatusSchema = z.enum(['normal', 'warning', 'critical']);
export type MaintenanceStatus = z.infer<typeof maintenanceStatusSchema>;

export const maintenanceAlertSchema = z.object({
  type: scheduledMaintenanceTypeSchema,
  intervalKm: z.int(),
  warningKm: z.int(),
  lastRecord: z
    .object({
      id: z.uuid(),
      performedOn: z.iso.date(),
      odometerKm: z.int(),
    })
    .nullable(),
  dueAtKm: z.int().nullable(),
  remainingKm: z.int().nullable(),
  status: maintenanceStatusSchema.nullable(),
});
export type MaintenanceAlert = z.infer<typeof maintenanceAlertSchema>;

export const maintenanceAlertsSchema = z.object({
  currentOdometerKm: z.int().nullable(),
  alerts: z.array(maintenanceAlertSchema),
});
export type MaintenanceAlerts = z.infer<typeof maintenanceAlertsSchema>;
