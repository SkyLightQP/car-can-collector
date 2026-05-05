export class CanRaw {
  readonly #timestamp: Date;
  readonly #deviceId: string;
  readonly #canId: number;
  readonly #dlc: number;
  readonly #data: Buffer;

  private constructor(timestamp: Date, deviceId: string, canId: number, dlc: number, data: Buffer) {
    this.#timestamp = timestamp;
    this.#deviceId = deviceId;
    this.#canId = canId;
    this.#dlc = dlc;
    this.#data = data;
  }

  get timestamp(): Date {
    return this.#timestamp;
  }

  get deviceId(): string {
    return this.#deviceId;
  }

  get canId(): number {
    return this.#canId;
  }

  get dlc(): number {
    return this.#dlc;
  }

  get data(): Buffer {
    return this.#data;
  }

  toHex(): string {
    return this.data.subarray(0, this.dlc).toString('hex').toUpperCase();
  }

  static from(timestamp: Date, deviceId: string, canId: number, dlc: number, data: Buffer): CanRaw {
    return new CanRaw(timestamp, deviceId, canId, dlc, data);
  }
}
