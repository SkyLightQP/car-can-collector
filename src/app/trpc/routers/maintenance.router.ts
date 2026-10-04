import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc';
import {
  type CreateMaintenanceRecordInput,
  createMaintenanceRecordInputSchema,
  type DeleteMaintenanceRecordInput,
  deleteMaintenanceRecordInputSchema,
  type MaintenanceAlerts,
  maintenanceAlertsSchema,
  maintenanceRecordSchema,
  maintenanceRecordsSchema,
  type MaintenanceRecordView,
  maintenanceScheduleSchema,
  maintenanceSchedulesSchema,
  type MaintenanceScheduleView,
  type UpdateMaintenanceRecordInput,
  updateMaintenanceRecordInputSchema,
  type UpdateMaintenanceScheduleInput,
} from '../schemas/maintenance.schema';

export interface MaintenanceOperations {
  getAlerts(): Promise<MaintenanceAlerts>;
  listRecords(): Promise<MaintenanceRecordView[]>;
  createRecord(input: CreateMaintenanceRecordInput): Promise<MaintenanceRecordView>;
  updateRecord(input: UpdateMaintenanceRecordInput): Promise<MaintenanceRecordView | null>;
  deleteRecord(input: DeleteMaintenanceRecordInput): Promise<DeleteMaintenanceRecordInput | null>;
  listSchedules(): Promise<MaintenanceScheduleView[]>;
  updateSchedule(input: UpdateMaintenanceScheduleInput): Promise<MaintenanceScheduleView | null>;
}

export function createMaintenanceRouter(operations: MaintenanceOperations) {
  return router({
    alerts: publicProcedure.output(maintenanceAlertsSchema).query(() => operations.getAlerts()),
    records: router({
      list: publicProcedure.output(maintenanceRecordsSchema).query(() => operations.listRecords()),
      create: publicProcedure
        .input(createMaintenanceRecordInputSchema)
        .output(maintenanceRecordSchema)
        .mutation(({ input }) => operations.createRecord(input)),
      update: publicProcedure
        .input(updateMaintenanceRecordInputSchema)
        .output(maintenanceRecordSchema)
        .mutation(async ({ input }) => orNotFound(await operations.updateRecord(input), '정비 이력이 없다')),
      delete: publicProcedure
        .input(deleteMaintenanceRecordInputSchema)
        .output(deleteMaintenanceRecordInputSchema)
        .mutation(async ({ input }) => orNotFound(await operations.deleteRecord(input), '정비 이력이 없다')),
    }),
    schedules: router({
      list: publicProcedure.output(maintenanceSchedulesSchema).query(() => operations.listSchedules()),
      update: publicProcedure
        .input(maintenanceScheduleSchema)
        .output(maintenanceScheduleSchema)
        .mutation(async ({ input }) => orNotFound(await operations.updateSchedule(input), '정비 주기 설정이 없다')),
    }),
  });
}

function orNotFound<T>(value: T | null, message: string): T {
  if (value === null) throw new TRPCError({ code: 'NOT_FOUND', message });
  return value;
}
