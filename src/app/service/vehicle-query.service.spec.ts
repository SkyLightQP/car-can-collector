import { CanRecord, type CanRecordInput } from '@app/domain/can-record';
import type { CanRecordRepository } from '@infrastructure/repository/can-record.repository';
import { VehicleQueryService } from './vehicle-query.service';

const recordInput: CanRecordInput = {
  timestamp: new Date('2026-09-24T09:00:00.000Z'),
  deviceId: 'esp32-1',
  odometerKm: 48213.39990234375,
  vehicleSpeedKph: 0,
  clusterSpeedKph: 0,
  engineRpm: 0,
  engineOn: false,
  tpmsFlPsi: 34,
  tpmsFrPsi: 33,
  tpmsRlPsi: null,
  tpmsRrPsi: 35,
  tpmsWarnLamp: true,
  tpmsStatus: 'Normal',
  ambientTempC: 22,
  driveMode: 'Eco',
  coolantTempC: 30,
  steeringAngleDeg: 0,
  batteryVoltageV: 12.399999618530273,
};

function setup() {
  const findLatest = jest.fn().mockResolvedValue(CanRecord.from(recordInput));
  const findDailyRestingVoltage = jest.fn().mockResolvedValue([]);
  const repository = { findLatest, findDailyRestingVoltage } as unknown as CanRecordRepository;
  return { service: new VehicleQueryService(repository), findLatest, findDailyRestingVoltage };
}

function useNow(iso: string) {
  jest.useFakeTimers({ now: new Date(iso), doNotFake: ['nextTick', 'queueMicrotask'] });
}

describe('VehicleQueryService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getStatus', () => {
    it('레코드가 없으면 null', async () => {
      const { service, findLatest } = setup();
      findLatest.mockResolvedValue(null);
      await expect(service.getStatus()).resolves.toBeNull();
    });

    it('최신 레코드를 상태로 변환한다', async () => {
      const { service } = setup();
      await expect(service.getStatus()).resolves.toEqual({
        measuredAt: '2026-09-24T09:00:00.000Z',
        engineOn: false,
        odometerKm: 48213.4,
        batteryVoltageV: 12.4,
        tires: { frontLeft: 34, frontRight: 33, rearLeft: null, rearRight: 35 },
        tpmsWarnLamp: true,
        tpmsStatus: 'Normal',
      });
    });

    it('engine_on 이 기본값 false 로 남은 레코드라도 RPM 이 0보다 크면 시동 중이다', async () => {
      const { service, findLatest } = setup();
      findLatest.mockResolvedValue(CanRecord.from({ ...recordInput, engineRpm: 1362.5, engineOn: false }));
      const status = await service.getStatus();
      expect(status?.engineOn).toBe(true);
    });
  });

  describe('getBatteryHistory', () => {
    it('KST 오늘 포함 days 일을 조회하고 빈 날은 null 로 채운다', async () => {
      useNow('2026-09-24T15:30:00Z');
      const { service, findDailyRestingVoltage } = setup();
      findDailyRestingVoltage.mockResolvedValue([{ date: '2026-09-24', voltageV: 12.43333 }]);

      await expect(service.getBatteryHistory({ days: 3 })).resolves.toEqual([
        { date: '2026-09-23', voltageV: null },
        { date: '2026-09-24', voltageV: 12.43 },
        { date: '2026-09-25', voltageV: null },
      ]);
      expect(findDailyRestingVoltage).toHaveBeenCalledWith(
        new Date('2026-09-22T15:00:00.000Z'),
        new Date('2026-09-25T15:00:00.000Z')
      );
    });

    it('데이터가 전혀 없으면 모든 날이 null', async () => {
      useNow('2026-09-24T03:00:00Z');
      const { service } = setup();
      const history = await service.getBatteryHistory({ days: 7 });
      expect(history).toHaveLength(7);
      expect(history.every((point) => point.voltageV === null)).toBe(true);
      expect(history[6].date).toBe('2026-09-24');
    });
  });
});
