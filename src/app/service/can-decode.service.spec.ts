import { CanRaw } from '@app/domain/can-raw';
import { CanRecord } from '@app/domain/can-record';
import type { CanRecordRepository } from '@infrastructure/repository/can-record.repository';
import { CanDecodeService } from './can-decode.service';

const DEVICE_ID = 'esp32-test';

function odometerFrame(at: Date, odometerKm: number): CanRaw {
  const data = Buffer.alloc(8);
  data.writeUIntLE(Math.round(odometerKm * 10), 0, 3);
  return CanRaw.from(at, DEVICE_ID, 0x5b0, 8, data);
}

function engineFrame(at: Date, rpm: number, speedKph: number): CanRaw {
  const data = Buffer.alloc(8);
  data.writeUInt16LE(rpm * 4, 2);
  data.writeUInt8(speedKph, 6);
  return CanRaw.from(at, DEVICE_ID, 0x316, 8, data);
}

function setup(latestRecords: CanRecord[] = []) {
  const repository = {
    findLatestPerDevice: jest.fn().mockResolvedValue(latestRecords),
  } as unknown as CanRecordRepository;
  return new CanDecodeService(repository);
}

describe('CanDecodeService', () => {
  it('직전 배치와 가까우면 느린 신호(odometer)를 이어서 쓴다', () => {
    const service = setup();
    service.decode([odometerFrame(new Date('2026-10-01T00:00:00Z'), 97001.9)]);

    const [record] = service.decode([engineFrame(new Date('2026-10-01T00:00:02Z'), 800, 30)]);

    expect(record.odometerKm).toBeCloseTo(97001.9);
  });

  it('직전 배치와 5분 넘게 떨어지면 이전 상태를 버리고 odometer 를 미상(0)으로 둔다', () => {
    const service = setup();
    service.decode([odometerFrame(new Date('2026-05-09T13:26:00Z'), 85052.1)]);

    const [record] = service.decode([engineFrame(new Date('2026-09-30T23:40:00Z'), 800, 0)]);

    expect(record.odometerKm).toBe(0);
    expect(record.engineRpm).toBe(800);
  });

  it('오래된 레코드에서 복원한 상태도 첫 배치에서 버린다', async () => {
    const stale = CanRecord.from({
      timestamp: new Date('2026-05-09T13:26:15Z'),
      deviceId: DEVICE_ID,
      odometerKm: 85052.1,
      vehicleSpeedKph: 0,
      clusterSpeedKph: 0,
      engineRpm: 720,
      engineOn: true,
      tpmsFlPsi: 35,
      tpmsFrPsi: 35,
      tpmsRlPsi: 35,
      tpmsRrPsi: 35,
      tpmsWarnLamp: false,
      tpmsStatus: 'Normal',
      ambientTempC: 20,
      driveMode: 'Normal',
      coolantTempC: 90,
      steeringAngleDeg: 0,
      batteryVoltageV: 14,
    });
    const service = setup([stale]);
    await service.onModuleInit();

    const [record] = service.decode([engineFrame(new Date('2026-09-30T23:40:00Z'), 800, 0)]);

    expect(record.odometerKm).toBe(0);
    expect(record.driveMode).toBe('Unknown');
  });

  it('최근 레코드에서 복원한 상태는 이어서 쓴다', async () => {
    const recent = CanRecord.from({
      timestamp: new Date('2026-10-01T00:00:00Z'),
      deviceId: DEVICE_ID,
      odometerKm: 97001.9,
      vehicleSpeedKph: 0,
      clusterSpeedKph: 0,
      engineRpm: 720,
      engineOn: true,
      tpmsFlPsi: 35,
      tpmsFrPsi: 35,
      tpmsRlPsi: 35,
      tpmsRrPsi: 35,
      tpmsWarnLamp: false,
      tpmsStatus: 'Normal',
      ambientTempC: 20,
      driveMode: 'Normal',
      coolantTempC: 90,
      steeringAngleDeg: 0,
      batteryVoltageV: 14,
    });
    const service = setup([recent]);
    await service.onModuleInit();

    const [record] = service.decode([engineFrame(new Date('2026-10-01T00:01:00Z'), 800, 0)]);

    expect(record.odometerKm).toBeCloseTo(97001.9);
  });
});
