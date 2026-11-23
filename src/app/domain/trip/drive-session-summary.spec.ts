import type { DriveReplay } from '@app/trpc/schemas/trips.schema';
import { summarizeDriveSessions } from './drive-session-summary';

const T0 = Date.parse('2026-01-01T00:00:00.000Z');

function point(t: number, speedKph: number, accelPct = 0, brakeBar = 0) {
  return { t, speedKph, accelPct, brakeBar, steeringDeg: 0 };
}

function sessionOf(points: ReturnType<typeof point>[]): DriveReplay {
  return [
    {
      startedAt: new Date(points[0].t).toISOString(),
      endedAt: new Date(points[points.length - 1].t).toISOString(),
      points,
    },
  ];
}

describe('summarizeDriveSessions', () => {
  it('세션이 없으면 빈 배열을 반환한다', () => {
    expect(summarizeDriveSessions([])).toEqual([]);
  });

  it('포인트가 하나뿐인 세션은 거리와 평균 속도가 0 이고 NaN 이 없다', () => {
    const [summary] = summarizeDriveSessions(sessionOf([point(T0, 30, 10)]));

    expect(summary).toMatchObject({
      drivingMinutes: 0,
      distanceKm: 0,
      avgSpeedKph: 0,
      maxSpeedKph: 30,
      hardAccelCount: 0,
    });
  });

  it('1초 간격 포인트의 속도를 사다리꼴로 적분해 거리를 계산한다', () => {
    const points = Array.from({ length: 3601 }, (_, i) => point(T0 + i * 1000, 72));

    const [summary] = summarizeDriveSessions(sessionOf(points));

    expect(summary).toMatchObject({
      distanceKm: 72,
      avgSpeedKph: 72,
      drivingMinutes: 60,
    });
  });

  it('초당 10km/h 이상 가속과 감속을 급가속, 급제동으로 센다', () => {
    const points = [0, 10, 19, 7].map((speed, i) => point(T0 + i * 1000, speed));

    const [summary] = summarizeDriveSessions(sessionOf(points));

    expect(summary.hardAccelCount).toBe(1);
    expect(summary.hardBrakeCount).toBe(1);
  });

  it('포인트 간격이 벌어지면 초당 변화량으로 판정한다', () => {
    const twoSeconds = [point(T0, 0), point(T0 + 2000, 20)];
    const threeSeconds = [point(T0, 0), point(T0 + 3000, 20)];

    const [twoSecondSummary] = summarizeDriveSessions(sessionOf(twoSeconds));
    const [threeSecondSummary] = summarizeDriveSessions(sessionOf(threeSeconds));

    expect(twoSecondSummary.hardAccelCount).toBe(1);
    expect(threeSecondSummary.hardAccelCount).toBe(0);
  });

  it('최대 브레이크 압력과 최대 페달 개도를 고른다', () => {
    const points = [point(T0, 10, 20, 1), point(T0 + 1000, 20, 80, 5), point(T0 + 2000, 15, 40, 3)];

    const [summary] = summarizeDriveSessions(sessionOf(points));

    expect(summary.maxBrakeBar).toBe(5);
    expect(summary.maxAccelPct).toBe(80);
    expect(summary.maxSpeedKph).toBe(20);
  });

  it('포인트가 수십만 개인 긴 세션도 최댓값을 구한다', () => {
    const points = Array.from({ length: 300_000 }, (_, i) => point(T0 + i * 50, i === 150_000 ? 180 : 60, 20, 5));

    const [summary] = summarizeDriveSessions(sessionOf(points));

    expect(summary).toMatchObject({ maxSpeedKph: 180, maxAccelPct: 20, maxBrakeBar: 5 });
  });
});
