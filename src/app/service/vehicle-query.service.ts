import { Injectable } from '@nestjs/common';
import { CanRecordRepository, type DailyVoltageRow } from '@infrastructure/repository/can-record.repository';
import type { VehicleQueries } from '@app/trpc/routers/vehicle.router';
import type { BatteryHistory, BatteryHistoryInput, VehicleStatus } from '@app/trpc/schemas/vehicle.schema';
import { addDays, dateRange, kstMidnight, kstToday } from './kst-date';
import { round1, round2 } from './driving-stats';

@Injectable()
export class VehicleQueryService implements VehicleQueries {
  constructor(private readonly canRecordRepository: CanRecordRepository) {}

  async getStatus(): Promise<VehicleStatus | null> {
    const record = await this.canRecordRepository.findLatest();
    if (!record) return null;

    return {
      measuredAt: record.timestamp.toISOString(),
      engineOn: record.engineRpm > 0,
      odometerKm: round1(record.odometerKm),
      batteryVoltageV: record.batteryVoltageV > 0 ? round1(record.batteryVoltageV) : null,
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
    const to = kstToday(new Date());
    const from = addDays(to, -(days - 1));
    const rows = await this.canRecordRepository.findDailyRunningVoltage(kstMidnight(from), kstMidnight(addDays(to, 1)));

    return fillMissingDays(dateRange(from, to), rows).map((day) => ({
      date: day.date,
      voltageV: day.voltageV === null ? null : round2(day.voltageV),
    }));
  }
}

function fillMissingDays(dates: string[], rows: DailyVoltageRow[]): { date: string; voltageV: number | null }[] {
  const voltageByDate = new Map(rows.map((row) => [row.date, row.voltageV]));
  return dates.map((date) => ({ date, voltageV: voltageByDate.get(date) ?? null }));
}
