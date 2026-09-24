import { createCallerFactory } from '../trpc';
import type { LastTrip } from '../schemas/trips.schema';
import { createTripsRouter, type TripQueries } from './trips.router';

const lastTrip: LastTrip = {
  startedAt: '2026-09-24T09:24:00.000Z',
  endedAt: '2026-09-24T10:24:00.000Z',
  distanceKm: 35.7,
  maxSpeedKph: 89,
  avgSpeedKph: 36,
  durationMinutes: 60,
};

function setup() {
  const getDaily = jest.fn().mockResolvedValue([]);
  const getLast = jest.fn().mockResolvedValue(lastTrip);
  const getWeekly = jest.fn().mockResolvedValue([]);
  const queries: TripQueries = { getDaily, getLast, getWeekly };
  const caller = createCallerFactory(createTripsRouter(queries))({});
  return { caller, getDaily, getLast, getWeekly };
}

describe('trips router', () => {
  describe('daily', () => {
    it('기간을 그대로 전달한다', async () => {
      const { caller, getDaily } = setup();
      await caller.daily({ from: '2026-09-01', to: '2026-09-07' });
      expect(getDaily).toHaveBeenCalledWith({ from: '2026-09-01', to: '2026-09-07' });
    });

    it('하루짜리 기간(from = to)을 허용한다', async () => {
      const { caller } = setup();
      await expect(caller.daily({ from: '2026-09-01', to: '2026-09-01' })).resolves.toEqual([]);
    });

    it('92일(양 끝 포함)까지 허용한다', async () => {
      const { caller } = setup();
      await expect(caller.daily({ from: '2026-01-01', to: '2026-04-02' })).resolves.toEqual([]);
    });

    it('93일은 BAD_REQUEST 로 거절한다', async () => {
      const { caller, getDaily } = setup();
      await expect(caller.daily({ from: '2026-01-01', to: '2026-04-03' })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
      expect(getDaily).not.toHaveBeenCalled();
    });

    it('from 이 to 보다 늦으면 BAD_REQUEST 로 거절한다', async () => {
      const { caller } = setup();
      await expect(caller.daily({ from: '2026-09-07', to: '2026-09-01' })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });

    it.each(['2026-9-1', '2026-02-30', '2026-13-01', '2026-09-01T00:00:00Z'])(
      '잘못된 날짜 %p 는 BAD_REQUEST 로 거절한다',
      async (from) => {
        const { caller, getDaily } = setup();
        await expect(caller.daily({ from, to: '2026-09-07' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(getDaily).not.toHaveBeenCalled();
      }
    );
  });

  describe('last', () => {
    it('최근 주행을 반환한다', async () => {
      const { caller } = setup();
      await expect(caller.last()).resolves.toEqual(lastTrip);
    });

    it('주행이 없으면 null 을 반환한다', async () => {
      const { caller, getLast } = setup();
      getLast.mockResolvedValue(null);
      await expect(caller.last()).resolves.toBeNull();
    });
  });

  describe('weekly', () => {
    it('입력 없이 호출하면 weeks=6 으로 조회한다', async () => {
      const { caller, getWeekly } = setup();
      await caller.weekly();
      expect(getWeekly).toHaveBeenCalledWith({ weeks: 6 });
    });

    it('weeks 를 넘기면 그대로 전달한다', async () => {
      const { caller, getWeekly } = setup();
      await caller.weekly({ weeks: 12 });
      expect(getWeekly).toHaveBeenCalledWith({ weeks: 12 });
    });

    it.each([0, 27])('weeks=%p 는 BAD_REQUEST 로 거절한다', async (weeks) => {
      const { caller } = setup();
      await expect(caller.weekly({ weeks })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('출력의 drivingMinutes 가 정수가 아니면 INTERNAL_SERVER_ERROR 로 실패한다', async () => {
      const { caller, getWeekly } = setup();
      getWeekly.mockResolvedValue([{ weekStart: '2026-09-21', distanceKm: 1, avgSpeedKph: 1, drivingMinutes: 1.5 }]);
      await expect(caller.weekly()).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
    });
  });
});
