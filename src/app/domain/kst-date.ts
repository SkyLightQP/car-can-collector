const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export class KstDate {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  get value(): string {
    return this.#value;
  }

  get startsAt(): Date {
    return new Date(`${this.#value}T00:00:00+09:00`);
  }

  get weekStart(): KstDate {
    const dayOfWeek = new Date(this.#calendarTime()).getUTCDay();
    return this.addDays(-((dayOfWeek + 6) % 7));
  }

  addDays(days: number): KstDate {
    return KstDate.#fromCalendarTime(this.#calendarTime() + days * DAY_MS);
  }

  datesThrough(end: KstDate): KstDate[] {
    const dayCount = (end.#calendarTime() - this.#calendarTime()) / DAY_MS + 1;
    return Array.from({ length: Math.max(dayCount, 0) }, (_, offset) => this.addDays(offset));
  }

  #calendarTime(): number {
    return Date.parse(`${this.#value}T00:00:00Z`);
  }

  static from(value: string): KstDate {
    return new KstDate(value);
  }

  static today(now: Date): KstDate {
    return KstDate.#fromCalendarTime(now.getTime() + KST_OFFSET_MS);
  }

  static #fromCalendarTime(time: number): KstDate {
    return new KstDate(new Date(time).toISOString().slice(0, 10));
  }
}
