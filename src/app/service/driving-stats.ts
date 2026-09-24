export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function averageSpeedKph(distanceKm: number, drivingSeconds: number): number {
  return drivingSeconds > 0 ? round1(distanceKm / (drivingSeconds / 3600)) : 0;
}

export function toMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}
