import { Injectable } from '@nestjs/common';
import { CanRaw } from '@app/domain/can-raw';
import { CanRecord } from '@app/domain/can-record';

const DRIVE_MODE: Record<number, string> = {
  0: 'Normal',
  1: 'Eco',
  2: 'Sport',
  3: 'Smart',
};

interface DeviceState {
  odometerKm: number;
  vehicleSpeedKph: number;
  engineRpm: number;
  tpms: `${string}#${string}#${string}#${string}`;
  ambientTempC: number;
  driveMode: string;
  coolantTempC: number;
  steeringAngleDeg: number;
  batteryVoltageV: number;
}

const DEFAULT_STATE: DeviceState = {
  odometerKm: 0,
  vehicleSpeedKph: 0,
  engineRpm: 0,
  tpms: '0#0#0#0',
  ambientTempC: 0,
  driveMode: 'Unknown',
  coolantTempC: 0,
  steeringAngleDeg: 0,
  batteryVoltageV: 0,
};

@Injectable()
export class CanDecodeService {
  private readonly deviceState = new Map<string, DeviceState>();

  decode(frames: CanRaw[]): CanRecord[] {
    const byDevice = new Map<string, CanRaw[]>();
    for (const frame of frames) {
      const list = byDevice.get(frame.deviceId) ?? [];
      list.push(frame);
      byDevice.set(frame.deviceId, list);
    }

    const records: CanRecord[] = [];
    for (const [deviceId, deviceFrames] of byDevice) {
      const state = this.deviceState.get(deviceId) ?? { ...DEFAULT_STATE };
      let latestTimestamp: Date | null = null;
      let hasRelevantFrame = false;

      deviceFrames.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      for (const frame of deviceFrames) {
        if (this.applyFrame(state, frame)) hasRelevantFrame = true;
        if (!latestTimestamp || frame.timestamp > latestTimestamp) latestTimestamp = frame.timestamp;
      }

      this.deviceState.set(deviceId, state);

      if (hasRelevantFrame && latestTimestamp) {
        records.push(CanRecord.from({ timestamp: latestTimestamp, deviceId, ...state }));
      }
    }

    return records;
  }

  private applyFrame(state: DeviceState, frame: CanRaw): boolean {
    const data = frame.data;

    switch (frame.canId) {
      case 0x316: // EMS11 — RPM, 차속
        state.engineRpm = this.decodeSignal(data, 16, 16, false, 0.25, 0);
        state.vehicleSpeedKph = this.decodeSignal(data, 48, 8, false, 1.0, 0);
        return true;

      case 0x329: // EMS12 — 냉각수 온도
        state.coolantTempC = this.decodeSignal(data, 8, 8, false, 0.75, -48.0);
        return true;

      case 0x2b0: // SAS11 — 조향각
        state.steeringAngleDeg = this.decodeSignal(data, 0, 16, true, 0.1, 0);
        return true;

      case 0x44: // DATC11 — 외기온도
        state.ambientTempC = this.decodeSignal(data, 24, 8, false, 0.5, -41.0);
        return true;

      case 0x50c: // CLU13 — 드라이브 모드
        state.driveMode = DRIVE_MODE[this.decodeSignal(data, 16, 2, false, 1.0, 0)] ?? 'Unknown';
        return true;

      case 0x545: // EMS14 — 배터리 전압
        state.batteryVoltageV = this.decodeSignal(data, 24, 8, false, 0.1015625, 0);
        return true;

      case 0x593: // TPMS11 — 타이어 공기압 (FL#FR#RL#RR)
        state.tpms = this.decodeTpms(data);
        return true;

      case 0x5b0: // CLU12 — ODO 주행거리
        state.odometerKm = this.decodeSignal(data, 0, 24, false, 0.1, 0);
        return true;

      default:
        return false;
    }
  }

  private decodeTpms(data: Buffer): `${string}#${string}#${string}#${string}` {
    const [fl, fr, rl, rr] = [
      this.#extractLE(data, 16, 8),
      this.#extractLE(data, 24, 8),
      this.#extractLE(data, 32, 8),
      this.#extractLE(data, 40, 8),
    ];
    const fmt = (p: number) => (p === 0xff ? 'N/A' : String(p));
    return `${fmt(fl)}#${fmt(fr)}#${fmt(rl)}#${fmt(rr)}`;
  }

  private decodeSignal(
    data: Buffer,
    startBit: number,
    length: number,
    signed: boolean,
    factor: number,
    offset: number
  ): number {
    let raw = this.#extractLE(data, startBit, length);
    if (signed) raw = this.#toSigned(raw, length);
    return raw * factor + offset;
  }

  #extractLE(data: Buffer, startBit: number, length: number): number {
    let raw = 0;
    for (let i = 0; i < length; i++) {
      const bitPos = startBit + i;
      const byteIdx = Math.floor(bitPos / 8);
      const bitIdx = bitPos % 8;
      if (byteIdx < data.length) raw |= ((data[byteIdx] >> bitIdx) & 1) << i;
    }
    return raw;
  }

  #toSigned(raw: number, length: number): number {
    return raw >= 1 << (length - 1) ? raw - (1 << length) : raw;
  }
}
