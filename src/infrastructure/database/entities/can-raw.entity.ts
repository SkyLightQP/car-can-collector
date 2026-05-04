import { Entity, PrimaryColumn, Column } from 'typeorm';
import { CanRaw } from '@app/domain/can-raw';

@Entity('can_raw')
export class CanRawEntity {
  @PrimaryColumn({ type: 'timestamptz', name: 'time' })
  timestamp: Date;

  @PrimaryColumn({ type: 'text', name: 'device_id' })
  deviceId: string;

  @PrimaryColumn({ type: 'integer', name: 'can_id' })
  canId: number;

  @Column({ type: 'smallint' })
  dlc: number;

  @Column({ type: 'bytea' })
  data: Buffer;

  static fromDomain(domain: CanRaw): CanRawEntity {
    const entity = new CanRawEntity();
    entity.timestamp = domain.timestamp;
    entity.deviceId = domain.deviceId;
    entity.canId = domain.canId;
    entity.dlc = domain.dlc;
    entity.data = domain.data;
    return entity;
  }

  toDomain(): CanRaw {
    return new CanRaw(this.timestamp, this.deviceId, this.canId, this.dlc, this.data);
  }
}
