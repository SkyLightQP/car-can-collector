import { Entity, PrimaryColumn, Column } from 'typeorm';
import { CanRecord } from '@app/domain/can-record';

@Entity('can_record')
export class CanRecordEntity {
  @PrimaryColumn({ type: 'timestamptz', name: 'time' })
  timestamp: Date;

  @PrimaryColumn({ type: 'text', name: 'device_id' })
  deviceId: string;

  @Column({ type: 'real', name: 'odometer_km' })
  odometerKm: number;

  @Column({ type: 'real', name: 'vehicle_speed_kph' })
  vehicleSpeedKph: number;

  @Column({ type: 'real', name: 'engine_rpm' })
  engineRpm: number;

  @Column({ type: 'real' })
  tpms: number;

  @Column({ type: 'real', name: 'ambient_temp_c' })
  ambientTempC: number;

  @Column({ type: 'text', name: 'drive_mode' })
  driveMode: string;

  @Column({ type: 'real', name: 'coolant_temp_c' })
  coolantTempC: number;

  @Column({ type: 'real', name: 'steering_angle_deg' })
  steeringAngleDeg: number;

  @Column({ type: 'real', name: 'battery_voltage_v' })
  batteryVoltageV: number;

  static fromDomain(domain: CanRecord): CanRecordEntity {
    const entity = new CanRecordEntity();
    entity.timestamp = domain.timestamp;
    entity.deviceId = domain.deviceId;
    entity.odometerKm = domain.odometerKm;
    entity.vehicleSpeedKph = domain.vehicleSpeedKph;
    entity.engineRpm = domain.engineRpm;
    entity.tpms = domain.tpms;
    entity.ambientTempC = domain.ambientTempC;
    entity.driveMode = domain.driveMode;
    entity.coolantTempC = domain.coolantTempC;
    entity.steeringAngleDeg = domain.steeringAngleDeg;
    entity.batteryVoltageV = domain.batteryVoltageV;
    return entity;
  }

  toDomain(): CanRecord {
    return CanRecord.from({
      timestamp: this.timestamp,
      deviceId: this.deviceId,
      odometerKm: this.odometerKm,
      vehicleSpeedKph: this.vehicleSpeedKph,
      engineRpm: this.engineRpm,
      tpms: this.tpms,
      ambientTempC: this.ambientTempC,
      driveMode: this.driveMode,
      coolantTempC: this.coolantTempC,
      steeringAngleDeg: this.steeringAngleDeg,
      batteryVoltageV: this.batteryVoltageV,
    });
  }
}