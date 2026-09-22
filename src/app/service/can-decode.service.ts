import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CanRaw } from '@app/domain/can-raw';
import { CanRecord } from '@app/domain/can-record';
import { CanRecordRepository } from '@infrastructure/repository/can-record.repository';

const DRIVE_MODE: Record<number, string> = {
  0: 'Normal',
  1: 'Eco',
  2: 'Sport',
  3: 'Smart',
};

/** 0x593 STATUS_TPMS. 센서 학습/오류 중에는 압력값을 신뢰할 수 없다. */
const TPMS_STATUS: Record<number, string> = {
  0: 'Normal',
  1: 'Initializing',
  2: 'Learning',
  3: 'Warning',
  4: 'Error',
};

/** 센서 미수신. 압력 바이트가 이 값이면 유효값이 아니다. */
const TPMS_NO_SENSOR = 0xff;

interface DeviceState {
  odometerKm: number;
  vehicleSpeedKph: number;
  clusterSpeedKph: number;
  engineRpm: number;
  engineOn: boolean;
  tpmsFlPsi: number | null;
  tpmsFrPsi: number | null;
  tpmsRlPsi: number | null;
  tpmsRrPsi: number | null;
  tpmsWarnLamp: boolean;
  tpmsStatus: string;
  ambientTempC: number;
  driveMode: string;
  coolantTempC: number;
  steeringAngleDeg: number;
  batteryVoltageV: number;
}

const DEFAULT_STATE: DeviceState = {
  odometerKm: 0,
  vehicleSpeedKph: 0,
  clusterSpeedKph: 0,
  engineRpm: 0,
  engineOn: false,
  tpmsFlPsi: null,
  tpmsFrPsi: null,
  tpmsRlPsi: null,
  tpmsRrPsi: null,
  tpmsWarnLamp: false,
  tpmsStatus: 'Unknown',
  ambientTempC: 0,
  driveMode: 'Unknown',
  coolantTempC: 0,
  steeringAngleDeg: 0,
  batteryVoltageV: 0,
};

@Injectable()
export class CanDecodeService implements OnModuleInit {
  private readonly logger = new Logger(CanDecodeService.name);
  private readonly deviceState = new Map<string, DeviceState>();

  constructor(private readonly canRecordRepository: CanRecordRepository) {}

  /**
   * 기기별 마지막 레코드로 디코더 상태를 복원한다.
   *
   * 상태가 메모리에만 있어서 재시작하면 초기화되는데, ODO(0x5B0)·TPMS(0x593) 같은
   * 느린 신호는 펌웨어가 60초에 한 번만 보낸다. 복원하지 않으면 그 사이 배치가
   * odometer_km = 0, drive_mode = 'Unknown' 으로 저장된다.
   *
   * 속도·RPM 같은 빠른 신호도 같이 복원하지만 0x316 은 배치마다 들어오므로 첫 배치에서 덮인다.
   */
  async onModuleInit(): Promise<void> {
    try {
      const records = await this.canRecordRepository.findLatestPerDevice();
      for (const record of records) {
        this.deviceState.set(record.deviceId, CanDecodeService.toDeviceState(record));
      }
      this.logger.log(`restored decoder state for ${records.length} device(s)`);
    } catch (error) {
      // 복원 실패가 수집을 막을 이유는 없다. 기본값으로 시작하면 첫 느린 프레임에서 채워진다.
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`failed to restore decoder state: ${reason}`);
    }
  }

  private static toDeviceState(record: CanRecord): DeviceState {
    return {
      odometerKm: record.odometerKm,
      vehicleSpeedKph: record.vehicleSpeedKph,
      clusterSpeedKph: record.clusterSpeedKph,
      engineRpm: record.engineRpm,
      engineOn: record.engineOn,
      tpmsFlPsi: record.tpmsFlPsi,
      tpmsFrPsi: record.tpmsFrPsi,
      tpmsRlPsi: record.tpmsRlPsi,
      tpmsRrPsi: record.tpmsRrPsi,
      tpmsWarnLamp: record.tpmsWarnLamp,
      tpmsStatus: record.tpmsStatus,
      ambientTempC: record.ambientTempC,
      driveMode: record.driveMode,
      coolantTempC: record.coolantTempC,
      steeringAngleDeg: record.steeringAngleDeg,
      batteryVoltageV: record.batteryVoltageV,
    };
  }

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
        // 캡처된 CAN ID 중 시동 상태를 직접 알려주는 신호가 없어 RPM 으로 대신한다.
        // 주행 시간·트립 경계를 구하려면 이 플래그가 필요하다.
        state.engineOn = state.engineRpm > 0;
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

      case 0x383: // FATC11 — 외기온도 (DATC 없는 차량용. 둘 중 오는 쪽이 값을 채운다)
        state.ambientTempC = this.decodeSignal(data, 24, 8, false, 0.5, -40.0);
        return true;

      case 0x4f1: // CLU11 — 클러스터 표시 차속 (0.5km/h 단위, EMS11 VS 보다 정밀)
        state.clusterSpeedKph = this.decodeSignal(data, 8, 9, false, 0.5, 0);
        return true;

      case 0x50c: // CLU13 — 드라이브 모드
        state.driveMode = DRIVE_MODE[this.decodeSignal(data, 16, 2, false, 1.0, 0)] ?? 'Unknown';
        return true;

      case 0x545: // EMS14 — 배터리 전압
        state.batteryVoltageV = this.decodeSignal(data, 24, 8, false, 0.1015625, 0);
        return true;

      case 0x593: // TPMS11 — 타이어 공기압 + 경고등
        this.applyTpms(state, data);
        return true;

      case 0x5b0: // CLU12 — ODO 주행거리
        state.odometerKm = this.decodeSignal(data, 0, 24, false, 0.1, 0);
        return true;

      default:
        return false;
    }
  }

  private applyTpms(state: DeviceState, data: Buffer): void {
    state.tpmsWarnLamp = this.#extractLE(data, 0, 2) !== 0;
    state.tpmsStatus = TPMS_STATUS[this.#extractLE(data, 8, 3)] ?? 'Unknown';
    state.tpmsFlPsi = this.#toPsi(this.#extractLE(data, 16, 8));
    state.tpmsFrPsi = this.#toPsi(this.#extractLE(data, 24, 8));
    state.tpmsRlPsi = this.#toPsi(this.#extractLE(data, 32, 8));
    state.tpmsRrPsi = this.#toPsi(this.#extractLE(data, 40, 8));
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

  #toPsi(raw: number): number | null {
    return raw === TPMS_NO_SENSOR ? null : raw;
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
