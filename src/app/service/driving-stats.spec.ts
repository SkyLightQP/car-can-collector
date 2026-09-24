import { averageSpeedKph, round1, round2, toMinutes } from './driving-stats';

describe('driving-stats', () => {
  it('round1 은 REAL 컬럼의 부동소수 오차를 정리한다', () => {
    expect(round1(42.29998779296875)).toBe(42.3);
  });

  it('round2 는 소수 둘째 자리로 반올림한다', () => {
    expect(round2(12.43333)).toBe(12.43);
  });

  it('averageSpeedKph = 거리 / 주행 시간(h)', () => {
    expect(averageSpeedKph(42.3, 67 * 60)).toBe(37.9);
  });

  it('주행 시간이 0이면 평균 속도는 0', () => {
    expect(averageSpeedKph(10, 0)).toBe(0);
  });

  it.each([
    [4020, 67],
    [89, 1],
    [29, 0],
  ])('toMinutes(%p) = %p', (seconds, minutes) => {
    expect(toMinutes(seconds)).toBe(minutes);
  });
});
