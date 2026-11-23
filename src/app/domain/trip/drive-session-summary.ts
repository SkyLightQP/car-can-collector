import type { DriveReplay, DriveReplaySession } from '@app/trpc/schemas/trips.schema';

export const HARD_EVENT_KPH_PER_SECOND = 10;

export interface DriveSessionSummary {
  startedAt: string;
  endedAt: string;
  drivingMinutes: number;
  distanceKm: number;
  maxSpeedKph: number;
  avgSpeedKph: number;
  hardAccelCount: number;
  hardBrakeCount: number;
  maxBrakeBar: number;
  maxAccelPct: number;
}

const MS_PER_HOUR = 3_600_000;

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function summarizeSession(session: DriveReplaySession): DriveSessionSummary {
  const { points } = session;
  const durationMs = Date.parse(session.endedAt) - Date.parse(session.startedAt);

  let distanceKm = 0;
  let hardAccelCount = 0;
  let hardBrakeCount = 0;
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const current = points[i];
    const elapsedMs = current.t - previous.t;
    if (elapsedMs <= 0) continue;

    distanceKm += (((previous.speedKph + current.speedKph) / 2) * elapsedMs) / MS_PER_HOUR;

    const kphPerSecond = ((current.speedKph - previous.speedKph) / elapsedMs) * 1000;
    if (kphPerSecond >= HARD_EVENT_KPH_PER_SECOND) hardAccelCount++;
    if (kphPerSecond <= -HARD_EVENT_KPH_PER_SECOND) hardBrakeCount++;
  }

  return {
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    drivingMinutes: Math.round(durationMs / 60_000),
    distanceKm: roundToTenth(distanceKm),
    maxSpeedKph: points.reduce((max, point) => Math.max(max, point.speedKph), 0),
    avgSpeedKph: durationMs > 0 ? roundToTenth(distanceKm / (durationMs / MS_PER_HOUR)) : 0,
    hardAccelCount,
    hardBrakeCount,
    maxBrakeBar: points.reduce((max, point) => Math.max(max, point.brakeBar), 0),
    maxAccelPct: points.reduce((max, point) => Math.max(max, point.accelPct), 0),
  };
}

export function summarizeDriveSessions(replay: DriveReplay): DriveSessionSummary[] {
  return replay.map(summarizeSession);
}
