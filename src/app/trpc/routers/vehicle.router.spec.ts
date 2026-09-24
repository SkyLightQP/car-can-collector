import { createCallerFactory } from '../trpc';
import type { VehicleStatus } from '../schemas/vehicle.schema';
import { createVehicleRouter, type VehicleQueries } from './vehicle.router';

const status: VehicleStatus = {
  measuredAt: '2026-09-24T09:00:00.000Z',
  engineOn: false,
  odometerKm: 48213.4,
  batteryVoltageV: 12.4,
  tires: { frontLeft: 34, frontRight: 33, rearLeft: null, rearRight: 35 },
  tpmsWarnLamp: false,
  tpmsStatus: 'Normal',
};

function setup() {
  const getStatus = jest.fn().mockResolvedValue(status);
  const getBatteryHistory = jest.fn().mockResolvedValue([{ date: '2026-09-24', voltageV: 12.41 }]);
  const queries: VehicleQueries = { getStatus, getBatteryHistory };
  const caller = createCallerFactory(createVehicleRouter(queries))({});
  return { caller, getStatus, getBatteryHistory };
}

describe('vehicle router', () => {
  describe('status', () => {
    it('최신 상태를 그대로 반환한다', async () => {
      const { caller } = setup();
      await expect(caller.status()).resolves.toEqual(status);
    });

    it('레코드가 없으면 null 을 반환한다', async () => {
      const { caller, getStatus } = setup();
      getStatus.mockResolvedValue(null);
      await expect(caller.status()).resolves.toBeNull();
    });

    it('출력 스키마를 어기면 INTERNAL_SERVER_ERROR 로 실패한다', async () => {
      const { caller, getStatus } = setup();
      getStatus.mockResolvedValue({ ...status, measuredAt: 'not-a-date' });
      await expect(caller.status()).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
    });
  });

  describe('batteryHistory', () => {
    it('입력 없이 호출하면 days=7 로 조회한다', async () => {
      const { caller, getBatteryHistory } = setup();
      await expect(caller.batteryHistory()).resolves.toEqual([{ date: '2026-09-24', voltageV: 12.41 }]);
      expect(getBatteryHistory).toHaveBeenCalledWith({ days: 7 });
    });

    it('빈 객체로 호출해도 days=7 로 조회한다', async () => {
      const { caller, getBatteryHistory } = setup();
      await caller.batteryHistory({});
      expect(getBatteryHistory).toHaveBeenCalledWith({ days: 7 });
    });

    it('days 를 넘기면 그대로 전달한다', async () => {
      const { caller, getBatteryHistory } = setup();
      await caller.batteryHistory({ days: 30 });
      expect(getBatteryHistory).toHaveBeenCalledWith({ days: 30 });
    });

    it.each([0, 91, 1.5])('days=%p 는 BAD_REQUEST 로 거절한다', async (days) => {
      const { caller, getBatteryHistory } = setup();
      await expect(caller.batteryHistory({ days })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      expect(getBatteryHistory).not.toHaveBeenCalled();
    });
  });
});
