import { addDays, dateRange, kstMidnight, kstToday, mondayOf } from './kst-date';

describe('kst-date', () => {
  describe('kstToday', () => {
    it('UTC 14:59:59 는 아직 같은 KST 날짜다', () => {
      expect(kstToday(new Date('2026-09-24T14:59:59Z'))).toBe('2026-09-24');
    });

    it('UTC 15:00 부터는 KST 다음 날이다', () => {
      expect(kstToday(new Date('2026-09-24T15:00:00Z'))).toBe('2026-09-25');
    });
  });

  describe('addDays', () => {
    it('월말을 넘긴다', () => {
      expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    });

    it('음수면 과거로 간다', () => {
      expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    });
  });

  describe('kstMidnight', () => {
    it('KST 자정 = 전날 UTC 15:00', () => {
      expect(kstMidnight('2026-09-24').toISOString()).toBe('2026-09-23T15:00:00.000Z');
    });
  });

  describe('dateRange', () => {
    it('양 끝을 포함해 월을 넘긴다', () => {
      expect(dateRange('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
    });

    it('from = to 면 하루', () => {
      expect(dateRange('2026-09-24', '2026-09-24')).toEqual(['2026-09-24']);
    });
  });

  describe('mondayOf', () => {
    it.each([
      ['2026-09-21', '2026-09-21'],
      ['2026-09-24', '2026-09-21'],
      ['2026-09-27', '2026-09-21'],
      ['2026-09-28', '2026-09-28'],
    ])('%s 가 속한 주의 월요일은 %s', (date, monday) => {
      expect(mondayOf(date)).toBe(monday);
    });
  });
});
