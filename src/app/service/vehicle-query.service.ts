import { Injectable } from '@nestjs/common';
import { CanRecordRepository } from '@infrastructure/repository/can-record.repository';
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
      batteryVoltageV: round1(record.batteryVoltageV),
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
    const rows = await this.canRecordRepository.findDailyRestingVoltage(kstMidnight(from), kstMidnight(addDays(to, 1)));
    const voltageByDate = new Map(rows.map((row) => [row.date, row.voltageV]));

    return dateRange(from, to).map((date) => {
      const voltage = voltageByDate.get(date);
      return { date, voltageV: voltage === undefined ? null : round2(voltage) };
    });
  }
}
