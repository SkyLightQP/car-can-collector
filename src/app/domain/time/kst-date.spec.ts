import { KstDate } from './kst-date';

describe('KstDate', () => {
  describe('today', () => {
    it('UTC 14:59:59 는 아직 같은 KST 날짜다', () => {
      expect(KstDate.today(new Date('2026-09-24T14:59:59Z')).value).toBe('2026-09-24');
    });

    it('UTC 15:00 부터는 KST 다음 날이다', () => {
      expect(KstDate.today(new Date('2026-09-24T15:00:00Z')).value).toBe('2026-09-25');
    });
  });

  describe('addDays', () => {
    it('월말을 넘긴다', () => {
      expect(KstDate.from('2026-02-28').addDays(1).value).toBe('2026-03-01');
    });

    it('음수면 과거로 간다', () => {
      expect(KstDate.from('2026-01-01').addDays(-1).value).toBe('2025-12-31');
    });
  });

  describe('startsAt', () => {
    it('KST 자정 = 전날 UTC 15:00', () => {
      expect(KstDate.from('2026-09-24').startsAt.toISOString()).toBe('2026-09-23T15:00:00.000Z');
    });
  });

  describe('datesThrough', () => {
    it('양 끝을 포함해 월을 넘긴다', () => {
      const dates = KstDate.from('2026-09-29').datesThrough(KstDate.from('2026-10-02'));
      expect(dates.map((date) => date.value)).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
    });

    it('같은 날이면 하루', () => {
      const dates = KstDate.from('2026-09-24').datesThrough(KstDate.from('2026-09-24'));
      expect(dates.map((date) => date.value)).toEqual(['2026-09-24']);
    });

    it('끝이 시작보다 앞이면 빈 목록', () => {
      expect(KstDate.from('2026-09-24').datesThrough(KstDate.from('2026-09-23'))).toEqual([]);
    });
  });

  describe('weekStart', () => {
    it.each([
      ['2026-09-21', '2026-09-21'],
      ['2026-09-24', '2026-09-21'],
      ['2026-09-27', '2026-09-21'],
      ['2026-09-28', '2026-09-28'],
    ])('%s 가 속한 주의 월요일은 %s', (date, monday) => {
      expect(KstDate.from(date).weekStart.value).toBe(monday);
    });
  });
});
