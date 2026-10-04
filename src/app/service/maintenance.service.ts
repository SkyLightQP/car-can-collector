import { Injectable } from '@nestjs/common';
import type { CanRecord } from '@app/domain/can-record';
import { MaintenanceRecord } from '@app/domain/maintenance-record';
import { MaintenanceSchedule } from '@app/domain/maintenance-schedule';
import type { MaintenanceOperations } from '@app/trpc/routers/maintenance.router';
import type {
  CreateMaintenanceRecordInput,
  DeleteMaintenanceRecordInput,
  MaintenanceAlerts,
  MaintenanceRecordView,
  MaintenanceScheduleView,
  UpdateMaintenanceRecordInput,
  UpdateMaintenanceScheduleInput,
} from '@app/trpc/schemas/maintenance.schema';
import { CanRecordRepository } from '@infrastructure/repository/can-record.repository';
import { MaintenanceRecordRepository } from '@infrastructure/repository/maintenance-record.repository';
import { MaintenanceScheduleRepository } from '@infrastructure/repository/maintenance-schedule.repository';

@Injectable()
export class MaintenanceService implements MaintenanceOperations {
  constructor(
    private readonly maintenanceRecordRepository: MaintenanceRecordRepository,
    private readonly maintenanceScheduleRepository: MaintenanceScheduleRepository,
    private readonly canRecordRepository: CanRecordRepository
  ) {}

  async getAlerts(): Promise<MaintenanceAlerts> {
    const [schedules, latestRecords, latestCanRecord] = await Promise.all([
      this.maintenanceScheduleRepository.findAll(),
      this.maintenanceRecordRepository.findLatestPerType(),
      this.canRecordRepository.findLatest(),
    ]);
    const currentOdometerKm = knownOdometerKm(latestCanRecord);
    const enabledSchedules = schedules.filter((schedule) => schedule.enabled);

    return {
      currentOdometerKm,
      alerts: attachLatestRecords(enabledSchedules, latestRecords).map(({ schedule, latestRecord }) =>
        schedule.alertFor(latestRecord, currentOdometerKm)
      ),
    };
  }

  async listRecords(): Promise<MaintenanceRecordView[]> {
    const records = await this.maintenanceRecordRepository.findAll();
    return records.map(toRecordView);
  }

  async createRecord(input: CreateMaintenanceRecordInput): Promise<MaintenanceRecordView> {
    return toRecordView(await this.maintenanceRecordRepository.create(input));
  }

  async updateRecord({ id, ...fields }: UpdateMaintenanceRecordInput): Promise<MaintenanceRecordView | null> {
    const record = await this.maintenanceRecordRepository.update(id, fields);
    return record ? toRecordView(record) : null;
  }

  async deleteRecord({ id }: DeleteMaintenanceRecordInput): Promise<DeleteMaintenanceRecordInput | null> {
    const deleted = await this.maintenanceRecordRepository.delete(id);
    return deleted ? { id } : null;
  }

  async listSchedules(): Promise<MaintenanceScheduleView[]> {
    const schedules = await this.maintenanceScheduleRepository.findAll();
    return schedules.map(toScheduleView);
  }

  async updateSchedule(input: UpdateMaintenanceScheduleInput): Promise<MaintenanceScheduleView | null> {
    const schedule = await this.maintenanceScheduleRepository.update(MaintenanceSchedule.from(input));
    return schedule ? toScheduleView(schedule) : null;
  }
}

function knownOdometerKm(record: CanRecord | null): number | null {
  if (!record || record.odometerKm <= 0) return null;
  return Math.round(record.odometerKm);
}

function attachLatestRecords(
  schedules: MaintenanceSchedule[],
  latestRecords: MaintenanceRecord[]
): { schedule: MaintenanceSchedule; latestRecord: MaintenanceRecord | null }[] {
  const latestRecordByType = new Map(latestRecords.map((record) => [record.type, record]));
  return schedules.map((schedule) => ({ schedule, latestRecord: latestRecordByType.get(schedule.type) ?? null }));
}

function toRecordView(record: MaintenanceRecord): MaintenanceRecordView {
  return {
    id: record.id,
    type: record.type,
    item: record.item,
    performedOn: record.performedOn,
    odometerKm: record.odometerKm,
    costKrw: record.costKrw,
    note: record.note,
  };
}

function toScheduleView(schedule: MaintenanceSchedule): MaintenanceScheduleView {
  return {
    type: schedule.type,
    intervalKm: schedule.intervalKm,
    warningKm: schedule.warningKm,
    enabled: schedule.enabled,
  };
}
