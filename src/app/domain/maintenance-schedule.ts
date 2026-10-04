import type {
  MaintenanceAlert,
  MaintenanceStatus,
  ScheduledMaintenanceType,
} from '@app/trpc/schemas/maintenance.schema';
import type { MaintenanceRecord } from './maintenance-record';

export interface MaintenanceScheduleInput {
  type: ScheduledMaintenanceType;
  intervalKm: number;
  warningKm: number;
  enabled: boolean;
}

export class MaintenanceSchedule {
  readonly #type: ScheduledMaintenanceType;
  readonly #intervalKm: number;
  readonly #warningKm: number;
  readonly #enabled: boolean;

  private constructor(input: MaintenanceScheduleInput) {
    this.#type = input.type;
    this.#intervalKm = input.intervalKm;
    this.#warningKm = input.warningKm;
    this.#enabled = input.enabled;
  }

  get type(): ScheduledMaintenanceType {
    return this.#type;
  }

  get intervalKm(): number {
    return this.#intervalKm;
  }

  get warningKm(): number {
    return this.#warningKm;
  }

  get enabled(): boolean {
    return this.#enabled;
  }

  alertFor(lastRecord: MaintenanceRecord | null, currentOdometerKm: number | null): MaintenanceAlert {
    const schedule = { type: this.#type, intervalKm: this.#intervalKm, warningKm: this.#warningKm };

    if (!lastRecord) {
      return { ...schedule, lastRecord: null, dueAtKm: null, remainingKm: null, status: 'warning' };
    }

    const lastService = { id: lastRecord.id, performedOn: lastRecord.performedOn, odometerKm: lastRecord.odometerKm };
    const dueAtKm = lastRecord.odometerKm + this.#intervalKm;

    if (currentOdometerKm === null) {
      return { ...schedule, lastRecord: lastService, dueAtKm, remainingKm: null, status: null };
    }

    const remainingKm = dueAtKm - currentOdometerKm;
    return { ...schedule, lastRecord: lastService, dueAtKm, remainingKm, status: this.#statusFor(remainingKm) };
  }

  #statusFor(remainingKm: number): MaintenanceStatus {
    if (remainingKm < 0) return 'critical';
    if (remainingKm <= this.#warningKm) return 'warning';
    return 'normal';
  }

  static from(input: MaintenanceScheduleInput): MaintenanceSchedule {
    return new MaintenanceSchedule(input);
  }
}
