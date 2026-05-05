/**
 * CAN 가공 데이터
 */
export class CanRecord {
  readonly #timestamp: Date;
  readonly #deviceId: string;
  readonly #odometerKm: number; // 누적 주행거리
  readonly #vehicleSpeedKph: number; // 차량 속도
  readonly #engineRpm: number; // RPM

  readonly #tpms: `${string}#${string}#${string}#${string}`; // 타이어 공기압
  readonly #ambientTempC: number; // 외기 온도
  readonly #driveMode: string; // 드라이브 모드

  readonly #coolantTempC: number; // 냉각수 온도
  readonly #steeringAngleDeg: number; // 조향각

  readonly #batteryVoltageV: number; // 배터리 전압

  private constructor(
    timestamp: Date,
    deviceId: string,
    odometerKm: number,
    vehicleSpeedKph: number,
    engineRpm: number,
    tpms: `${string}#${string}#${string}#${string}`,
    ambientTempC: number,
    driveMode: string,
    coolantTempC: number,
    steeringAngleDeg: number,
    batteryVoltageV: number
  ) {
    this.#timestamp = timestamp;
    this.#deviceId = deviceId;
    this.#odometerKm = odometerKm;
    this.#vehicleSpeedKph = vehicleSpeedKph;
    this.#engineRpm = engineRpm;
    this.#tpms = tpms;
    this.#ambientTempC = ambientTempC;
    this.#driveMode = driveMode;
    this.#coolantTempC = coolantTempC;
    this.#steeringAngleDeg = steeringAngleDeg;
    this.#batteryVoltageV = batteryVoltageV;
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

  get engineRpm(): number {
    return this.#engineRpm;
  }

  get tpms(): `${string}#${string}#${string}#${string}` {
    return this.#tpms;
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

  static from(input: {
    timestamp: Date;
    deviceId: string;
    odometerKm: number;
    vehicleSpeedKph: number;
    engineRpm: number;
    tpms: `${string}#${string}#${string}#${string}`;
    ambientTempC: number;
    driveMode: string;
    coolantTempC: number;
    steeringAngleDeg: number;
    batteryVoltageV: number;
  }): CanRecord {
    return new CanRecord(
      input.timestamp,
      input.deviceId,
      input.odometerKm,
      input.vehicleSpeedKph,
      input.engineRpm,
      input.tpms,
      input.ambientTempC,
      input.driveMode,
      input.coolantTempC,
      input.steeringAngleDeg,
      input.batteryVoltageV
    );
  }
}
