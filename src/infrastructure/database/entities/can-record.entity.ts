import { Column, Entity, PrimaryColumn } from 'typeorm';
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

  @Column({ type: 'real', name: 'cluster_speed_kph' })
  clusterSpeedKph: number;

  @Column({ type: 'real', name: 'engine_rpm' })
  engineRpm: number;

  @Column({ type: 'boolean', name: 'engine_on' })
  engineOn: boolean;

  @Column({ type: 'real', name: 'tpms_fl_psi', nullable: true })
  tpmsFlPsi: number | null;

  @Column({ type: 'real', name: 'tpms_fr_psi', nullable: true })
  tpmsFrPsi: number | null;

  @Column({ type: 'real', name: 'tpms_rl_psi', nullable: true })
  tpmsRlPsi: number | null;

  @Column({ type: 'real', name: 'tpms_rr_psi', nullable: true })
  tpmsRrPsi: number | null;

  @Column({ type: 'boolean', name: 'tpms_warn_lamp' })
  tpmsWarnLamp: boolean;

  @Column({ type: 'text', name: 'tpms_status' })
  tpmsStatus: string;

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
    entity.clusterSpeedKph = domain.clusterSpeedKph;
    entity.engineRpm = domain.engineRpm;
    entity.engineOn = domain.engineOn;
    entity.tpmsFlPsi = domain.tpmsFlPsi;
    entity.tpmsFrPsi = domain.tpmsFrPsi;
    entity.tpmsRlPsi = domain.tpmsRlPsi;
    entity.tpmsRrPsi = domain.tpmsRrPsi;
    entity.tpmsWarnLamp = domain.tpmsWarnLamp;
    entity.tpmsStatus = domain.tpmsStatus;
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
      clusterSpeedKph: this.clusterSpeedKph,
      engineRpm: this.engineRpm,
      engineOn: this.engineOn,
      tpmsFlPsi: this.tpmsFlPsi,
      tpmsFrPsi: this.tpmsFrPsi,
      tpmsRlPsi: this.tpmsRlPsi,
      tpmsRrPsi: this.tpmsRrPsi,
      tpmsWarnLamp: this.tpmsWarnLamp,
      tpmsStatus: this.tpmsStatus,
      ambientTempC: this.ambientTempC,
      driveMode: this.driveMode,
      coolantTempC: this.coolantTempC,
      steeringAngleDeg: this.steeringAngleDeg,
      batteryVoltageV: this.batteryVoltageV,
    });
  }
}
