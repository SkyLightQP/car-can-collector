import { DrivingStats } from './driving-stats';

describe('DrivingStats', () => {
  it('REAL 컬럼의 부동소수 오차를 정리해 거리와 최고 속도를 소수 첫째 자리로 반환한다', () => {
    const stats = DrivingStats.from({ distanceKm: 42.29998779296875, maxSpeedKph: 91.99999, drivingSeconds: 4020 });
    expect(stats.distanceKm).toBe(42.3);
    expect(stats.maxSpeedKph).toBe(92);
  });

  it('평균 속도 = 거리 / 주행 시간(h)', () => {
    expect(DrivingStats.from({ distanceKm: 42.3, maxSpeedKph: 92, drivingSeconds: 67 * 60 }).avgSpeedKph).toBe(37.9);
  });

  it('주행 시간이 0이면 평균 속도는 0', () => {
    expect(DrivingStats.from({ distanceKm: 10, maxSpeedKph: 5, drivingSeconds: 0 }).avgSpeedKph).toBe(0);
  });

  it.each([
    [4020, 67],
    [89, 1],
    [29, 0],
  ])('주행 %p초는 %p분', (drivingSeconds, minutes) => {
    expect(DrivingStats.from({ distanceKm: 0, maxSpeedKph: 0, drivingSeconds }).drivingMinutes).toBe(minutes);
  });

  it('empty 는 모든 값이 0', () => {
    const stats = DrivingStats.empty();
    expect([stats.distanceKm, stats.maxSpeedKph, stats.avgSpeedKph, stats.drivingMinutes]).toEqual([0, 0, 0, 0]);
  });
});
