const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function kstToday(now: Date): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function kstMidnight(date: string): Date {
  return new Date(`${date}T00:00:00+09:00`);
}

export function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

export function mondayOf(date: string): string {
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, -((dayOfWeek + 6) % 7));
}
