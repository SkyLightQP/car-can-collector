import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MaintenanceRecord } from '@app/domain/maintenance-record';
import type { MaintenanceType } from '@app/trpc/schemas/maintenance.schema';

@Entity('maintenance_record')
export class MaintenanceRecordEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ type: 'text', name: 'type' })
  type: MaintenanceType;

  @Column({ type: 'text', name: 'item' })
  item: string;

  @Column({ type: 'date', name: 'performed_on' })
  performedOn: string;

  @Column({ type: 'integer', name: 'odometer_km' })
  odometerKm: number;

  @Column({ type: 'integer', name: 'cost_krw' })
  costKrw: number;

  @Column({ type: 'text', name: 'note' })
  note: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  toDomain(): MaintenanceRecord {
    return MaintenanceRecord.from({
      id: this.id,
      type: this.type,
      item: this.item,
      performedOn: this.performedOn,
      odometerKm: this.odometerKm,
      costKrw: this.costKrw,
      note: this.note,
    });
  }
}
