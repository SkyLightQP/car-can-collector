export interface CanRecordInput {
  timestamp: Date;
  deviceId: string;
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

/**
 * CAN 가공 데이터
 */
export class CanRecord {
  readonly #timestamp: Date;
  readonly #deviceId: string;
  readonly #odometerKm: number; // 누적 주행거리
  readonly #vehicleSpeedKph: number; // 차량 속도 (EMS11, 1km/h 단위)
  readonly #clusterSpeedKph: number; // 클러스터 표시 속도 (CLU11, 0.5km/h 단위)
  readonly #engineRpm: number; // RPM
  readonly #engineOn: boolean; // 시동 여부 (RPM 기반 파생값)

  readonly #tpmsFlPsi: number | null; // 타이어 공기압 앞 왼쪽 (null = 센서 미수신)
  readonly #tpmsFrPsi: number | null; // 타이어 공기압 앞 오른쪽
  readonly #tpmsRlPsi: number | null; // 타이어 공기압 뒤 왼쪽
  readonly #tpmsRrPsi: number | null; // 타이어 공기압 뒤 오른쪽
  readonly #tpmsWarnLamp: boolean; // TPMS 경고등 점등 여부
  readonly #tpmsStatus: string; // TPMS 센서 상태

  readonly #ambientTempC: number; // 외기 온도
  readonly #driveMode: string; // 드라이브 모드

  readonly #coolantTempC: number; // 냉각수 온도
  readonly #steeringAngleDeg: number; // 조향각

  readonly #batteryVoltageV: number; // 배터리 전압

  private constructor(input: CanRecordInput) {
    this.#timestamp = input.timestamp;
    this.#deviceId = input.deviceId;
    this.#odometerKm = input.odometerKm;
    this.#vehicleSpeedKph = input.vehicleSpeedKph;
    this.#clusterSpeedKph = input.clusterSpeedKph;
    this.#engineRpm = input.engineRpm;
    this.#engineOn = input.engineOn;
    this.#tpmsFlPsi = input.tpmsFlPsi;
    this.#tpmsFrPsi = input.tpmsFrPsi;
    this.#tpmsRlPsi = input.tpmsRlPsi;
    this.#tpmsRrPsi = input.tpmsRrPsi;
    this.#tpmsWarnLamp = input.tpmsWarnLamp;
    this.#tpmsStatus = input.tpmsStatus;
    this.#ambientTempC = input.ambientTempC;
    this.#driveMode = input.driveMode;
    this.#coolantTempC = input.coolantTempC;
    this.#steeringAngleDeg = input.steeringAngleDeg;
    this.#batteryVoltageV = input.batteryVoltageV;
  }

  get timestamp(): Date {
    return this.#timestamp;
  }

  get deviceId(): string {
    return this.#deviceId;
  }

  get odometerKm(): number {
    return this.#odometerKm;
  }

  get vehicleSpeedKph(): number {
    return this.#vehicleSpeedKph;
  }

  get clusterSpeedKph(): number {
    return this.#clusterSpeedKph;
  }

  get engineRpm(): number {
    return this.#engineRpm;
  }

  get engineOn(): boolean {
    return this.#engineOn;
  }

  get tpmsFlPsi(): number | null {
    return this.#tpmsFlPsi;
  }

  get tpmsFrPsi(): number | null {
    return this.#tpmsFrPsi;
  }

  get tpmsRlPsi(): number | null {
    return this.#tpmsRlPsi;
  }

  get tpmsRrPsi(): number | null {
    return this.#tpmsRrPsi;
  }

  get tpmsWarnLamp(): boolean {
    return this.#tpmsWarnLamp;
  }

  get tpmsStatus(): string {
    return this.#tpmsStatus;
  }

  get ambientTempC(): number {
    return this.#ambientTempC;
  }

  get driveMode(): string {
    return this.#driveMode;
  }

  get coolantTempC(): number {
    return this.#coolantTempC;
  }

  get steeringAngleDeg(): number {
    return this.#steeringAngleDeg;
  }

  get batteryVoltageV(): number {
    return this.#batteryVoltageV;
  }

  static from(input: CanRecordInput): CanRecord {
    return new CanRecord(input);
  }
}
