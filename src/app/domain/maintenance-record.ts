import type { MaintenanceType } from '@app/trpc/schemas/maintenance.schema';

export interface MaintenanceRecordInput {
  id: string;
  type: MaintenanceType;
  item: string;
  performedOn: string;
  odometerKm: number;
  costKrw: number;
  note: string;
}

export type MaintenanceRecordFields = Omit<MaintenanceRecordInput, 'id'>;

export class MaintenanceRecord {
  readonly #id: string;
  readonly #type: MaintenanceType;
  readonly #item: string;
  readonly #performedOn: string;
  readonly #odometerKm: number;
  readonly #costKrw: number;
  readonly #note: string;

  private constructor(input: MaintenanceRecordInput) {
    this.#id = input.id;
    this.#type = input.type;
    this.#item = input.item;
    this.#performedOn = input.performedOn;
    this.#odometerKm = input.odometerKm;
    this.#costKrw = input.costKrw;
    this.#note = input.note;
  }

  get id(): string {
    return this.#id;
  }

  get type(): MaintenanceType {
    return this.#type;
  }

  get item(): string {
    return this.#item;
  }

  get performedOn(): string {
    return this.#performedOn;
  }

  get odometerKm(): number {
    return this.#odometerKm;
  }

  get costKrw(): number {
    return this.#costKrw;
  }

  get note(): string {
    return this.#note;
  }

  static from(input: MaintenanceRecordInput): MaintenanceRecord {
    return new MaintenanceRecord(input);
  }
}
