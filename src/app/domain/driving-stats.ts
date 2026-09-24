export interface DrivingStatsInput {
  distanceKm: number;
  maxSpeedKph: number;
  drivingSeconds: number;
}

export class DrivingStats {
  readonly #distanceKm: number;
  readonly #maxSpeedKph: number;
  readonly #drivingSeconds: number;

  private constructor(input: DrivingStatsInput) {
    this.#distanceKm = input.distanceKm;
    this.#maxSpeedKph = input.maxSpeedKph;
    this.#drivingSeconds = input.drivingSeconds;
  }

  get distanceKm(): number {
    return roundToTenth(this.#distanceKm);
  }

  get maxSpeedKph(): number {
    return roundToTenth(this.#maxSpeedKph);
  }

  get avgSpeedKph(): number {
    if (this.#drivingSeconds <= 0) return 0;
    return roundToTenth(this.#distanceKm / (this.#drivingSeconds / 3600));
  }

  get drivingMinutes(): number {
    return Math.round(this.#drivingSeconds / 60);
  }

  static from(input: DrivingStatsInput): DrivingStats {
    return new DrivingStats(input);
  }

  static empty(): DrivingStats {
    return new DrivingStats({ distanceKm: 0, maxSpeedKph: 0, drivingSeconds: 0 });
  }
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
