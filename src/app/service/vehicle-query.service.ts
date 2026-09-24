import { Injectable } from '@nestjs/common';
import { CanRecordRepository, type DailyVoltageRow } from '@infrastructure/repository/can-record.repository';
import type { VehicleQueries } from '@app/trpc/routers/vehicle.router';
import type { BatteryHistory, BatteryHistoryInput, VehicleStatus } from '@app/trpc/schemas/vehicle.schema';
import { KstDate } from '@app/domain/kst-date';

@Injectable()
export class VehicleQueryService implements VehicleQueries {
  constructor(private readonly canRecordRepository: CanRecordRepository) {}

  async getStatus(): Promise<VehicleStatus | null> {
    const record = await this.canRecordRepository.findLatest();
    if (!record) return null;

    return {
      measuredAt: record.timestamp.toISOString(),
      engineOn: record.engineRpm > 0,
      odometerKm: roundTo(record.odometerKm, 1),
      batteryVoltageV: record.batteryVoltageV > 0 ? roundTo(record.batteryVoltageV, 1) : null,
      tires: {
        frontLeft: record.tpmsFlPsi,
        frontRight: record.tpmsFrPsi,
        rearLeft: record.tpmsRlPsi,
        rearRight: record.tpmsRrPsi,
      },
      tpmsWarnLamp: record.tpmsWarnLamp,
      tpmsStatus: record.tpmsStatus,
    };
  }

  async getBatteryHistory({ days }: BatteryHistoryInput): Promise<BatteryHistory> {
    const today = KstDate.today(new Date());
    const firstDay = today.addDays(-(days - 1));
    const rows = await this.canRecordRepository.findDailyRunningVoltage(firstDay.startsAt, today.addDays(1).startsAt);

    return attachDailyVoltage(firstDay.datesThrough(today), rows).map(({ day, voltageV }) => ({
      date: day.value,
      voltageV: voltageV === null ? null : roundTo(voltageV, 2),
    }));
  }
}

function attachDailyVoltage(days: KstDate[], rows: DailyVoltageRow[]): { day: KstDate; voltageV: number | null }[] {
  const voltageByDate = new Map(rows.map((row) => [row.date, row.voltageV]));
  return days.map((day) => ({ day, voltageV: voltageByDate.get(day.value) ?? null }));
}

function roundTo(value: number, fractionDigits: number): number {
  const scale = 10 ** fractionDigits;
  return Math.round(value * scale) / scale;
}
