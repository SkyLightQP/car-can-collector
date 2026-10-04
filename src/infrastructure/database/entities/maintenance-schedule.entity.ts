import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { MaintenanceSchedule } from '@app/domain/maintenance-schedule';
import type { ScheduledMaintenanceType } from '@app/trpc/schemas/maintenance.schema';

@Entity('maintenance_schedule')
export class MaintenanceScheduleEntity {
  @PrimaryColumn({ type: 'text', name: 'type' })
  type: ScheduledMaintenanceType;

  @Column({ type: 'integer', name: 'interval_km' })
  intervalKm: number;

  @Column({ type: 'integer', name: 'warning_km' })
  warningKm: number;

  @Column({ type: 'boolean', name: 'enabled' })
  enabled: boolean;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  toDomain(): MaintenanceSchedule {
    return MaintenanceSchedule.from({
      type: this.type,
      intervalKm: this.intervalKm,
      warningKm: this.warningKm,
      enabled: this.enabled,
    });
  }
}
