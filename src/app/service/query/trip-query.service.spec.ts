import type { CanRecordRepository, DriverInputRow } from '@infrastructure/repository/can-record.repository';
import { TripQueryService } from './trip-query.service';

function setup() {
  const aggregateDriving = jest.fn().mockResolvedValue([]);
  const findLastSession = jest.fn().mockResolvedValue(null);
  const findDriverInputs = jest.fn().mockResolvedValue([]);
  const repository = { aggregateDriving, findLastSession, findDriverInputs } as unknown as CanRecordRepository;
  return { service: new TripQueryService(repository), aggregateDriving, findLastSession, findDriverInputs };
}

function row(iso: string, overrides: Partial<DriverInputRow> = {}): DriverInputRow {
  return { time: new Date(iso), speedKph: 30, accelPct: 10, brakeBar: 0, steeringDeg: 0, ...overrides };
}

function useNow(iso: string) {
  jest.useFakeTimers({ now: new Date(iso), doNotFake: ['nextTick', 'queueMicrotask'] });
}

describe('TripQueryService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getDaily', () => {
    it('KST 자정 경계로 조회하고 빈 날은 0 으로 채운다', async () => {
      const { service, aggregateDriving } = setup();
      aggregateDriving.mockResolvedValue([
        {
          bucket: '2026-09-02',
          distanceKm: 42.29998779296875,
          maxSpeedKph: 92,
          avgSpeedKph: 51.24,
          drivingSeconds: 4020,
        },
      ]);

      await expect(service.getDaily({ from: '2026-09-01', to: '2026-09-03' })).resolves.toEqual([
        { date: '2026-09-01', distanceKm: 0, avgSpeedKph: 0, maxSpeedKph: 0, drivingMinutes: 0 },
        { date: '2026-09-02', distanceKm: 42.3, avgSpeedKph: 51.2, maxSpeedKph: 92, drivingMinutes: 67 },
        { date: '2026-09-03', distanceKm: 0, avgSpeedKph: 0, maxSpeedKph: 0, drivingMinutes: 0 },
      ]);
      expect(aggregateDriving).toHaveBeenCalledWith(
        new Date('2026-08-31T15:00:00.000Z'),
        new Date('2026-09-03T15:00:00.000Z'),
        'day'
      );
    });

    it('odometer 거리가 튀어도 평균 속도는 차속 평균을 그대로 쓴다', async () => {
      const { service, aggregateDriving } = setup();
      aggregateDriving.mockResolvedValue([
        { bucket: '2026-09-01', distanceKm: 12054.5, maxSpeedKph: 132, avgSpeedKph: 67.6, drivingSeconds: 6094 },
      ]);
      const [day] = await service.getDaily({ from: '2026-09-01', to: '2026-09-01' });
      expect(day.avgSpeedKph).toBe(67.6);
    });
  });

  describe('getWeekly', () => {
    it('이번 주 포함 weeks 주를 월요일 기준으로 조회하고 빈 주는 0 으로 채운다', async () => {
      useNow('2026-09-27T14:00:00Z');
      const { service, aggregateDriving } = setup();
      aggregateDriving.mockResolvedValue([
        { bucket: '2026-09-21', distanceKm: 100, maxSpeedKph: 110, avgSpeedKph: 58, drivingSeconds: 7200 },
      ]);

      await expect(service.getWeekly({ weeks: 2 })).resolves.toEqual([
        { weekStart: '2026-09-14', distanceKm: 0, avgSpeedKph: 0, drivingMinutes: 0 },
        { weekStart: '2026-09-21', distanceKm: 100, avgSpeedKph: 58, drivingMinutes: 120 },
      ]);
      expect(aggregateDriving).toHaveBeenCalledWith(
        new Date('2026-09-13T15:00:00.000Z'),
        new Date('2026-09-27T15:00:00.000Z'),
        'week'
      );
    });

    it('KST 월요일 00:00 이 되면 새 주가 이번 주다', async () => {
      useNow('2026-09-27T15:00:00Z');
      const { service } = setup();
      const weeks = await service.getWeekly({ weeks: 1 });
      expect(weeks.map((week) => week.weekStart)).toEqual(['2026-09-28']);
    });
  });

  describe('getLast', () => {
    it('주행이 없으면 null', async () => {
      const { service } = setup();
      await expect(service.getLast()).resolves.toBeNull();
    });

    it('마지막 세션을 변환한다', async () => {
      const { service, findLastSession } = setup();
      findLastSession.mockResolvedValue({
        startedAt: new Date('2026-09-24T09:24:00.000Z'),
        endedAt: new Date('2026-09-24T10:25:10.000Z'),
        distanceKm: 35.70001220703125,
        maxSpeedKph: 89,
        avgSpeedKph: 42.04,
        drivingSeconds: 3570,
      });

      await expect(service.getLast()).resolves.toEqual({
        startedAt: '2026-09-24T09:24:00.000Z',
        endedAt: '2026-09-24T10:25:10.000Z',
        distanceKm: 35.7,
        maxSpeedKph: 89,
        avgSpeedKph: 42,
        durationMinutes: 60,
      });
    });
  });

  describe('getReplay', () => {
    it('today 는 KST 자정 경계로 조회한다', async () => {
      useNow('2026-10-25T03:00:00Z');
      const { service, findDriverInputs } = setup();
      await service.getReplay({ range: 'today' });
      expect(findDriverInputs).toHaveBeenCalledWith(
        new Date('2026-10-24T15:00:00.000Z'),
        new Date('2026-10-25T15:00:00.000Z')
      );
    });

    it('5분을 넘는 공백에서 주행을 나누고 정확히 5분은 같은 주행으로 둔다', async () => {
      const { service, findDriverInputs } = setup();
      findDriverInputs.mockResolvedValue([
        row('2026-10-25T00:00:00.000Z'),
        row('2026-10-25T00:05:00.000Z'),
        row('2026-10-25T00:10:00.001Z'),
        row('2026-10-25T00:10:01.300Z'),
      ]);
      const sessions = await service.getReplay({ range: 'today' });
      expect(sessions.map(({ startedAt, endedAt, points }) => [startedAt, endedAt, points.length])).toEqual([
        ['2026-10-25T00:00:00.000Z', '2026-10-25T00:05:00.000Z', 2],
        ['2026-10-25T00:10:00.001Z', '2026-10-25T00:10:01.300Z', 2],
      ]);
    });

    it('점은 epoch ms 시각과 소수 첫째 자리로 반올림한 값을 가진다', async () => {
      const { service, findDriverInputs } = setup();
      findDriverInputs.mockResolvedValue([
        row('2026-10-25T00:00:00.000Z', {
          speedKph: 61.99999,
          accelPct: 42.29998779296875,
          brakeBar: 14.04,
          steeringDeg: -3.25,
        }),
      ]);
      const [session] = await service.getReplay({ range: 'today' });
      expect(session.points).toEqual([
        { t: Date.parse('2026-10-25T00:00:00.000Z'), speedKph: 62, accelPct: 42.3, brakeBar: 14, steeringDeg: -3.2 },
      ]);
    });

    it('today 에 레코드가 없으면 빈 배열이다', async () => {
      const { service } = setup();
      await expect(service.getReplay({ range: 'today' })).resolves.toEqual([]);
    });

    it('last 는 마지막 세션 구간을 끝 포함으로 조회한다', async () => {
      const { service, findLastSession, findDriverInputs } = setup();
      findLastSession.mockResolvedValue({
        startedAt: new Date('2026-10-25T00:00:00.000Z'),
        endedAt: new Date('2026-10-25T00:04:00.000Z'),
        distanceKm: 3,
        maxSpeedKph: 80,
        avgSpeedKph: 40,
        drivingSeconds: 240,
      });
      findDriverInputs.mockResolvedValue([row('2026-10-25T00:00:00.000Z'), row('2026-10-25T00:04:00.000Z')]);
      const sessions = await service.getReplay({ range: 'last' });
      expect(findDriverInputs).toHaveBeenCalledWith(
        new Date('2026-10-25T00:00:00.000Z'),
        new Date('2026-10-25T00:04:00.001Z')
      );
      expect(sessions).toHaveLength(1);
    });

    it('last 주행이 없으면 빈 배열이고 레코드를 조회하지 않는다', async () => {
      const { service, findDriverInputs } = setup();
      await expect(service.getReplay({ range: 'last' })).resolves.toEqual([]);
      expect(findDriverInputs).not.toHaveBeenCalled();
    });
  });
});
