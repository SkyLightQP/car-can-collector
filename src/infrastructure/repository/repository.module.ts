import { Module } from '@nestjs/common';
import { CanRawRepository } from '@infrastructure/repository/can-raw.repository';
import { CanRecordRepository } from '@infrastructure/repository/can-record.repository';
import { MaintenanceRecordRepository } from '@infrastructure/repository/maintenance-record.repository';
import { MaintenanceScheduleRepository } from '@infrastructure/repository/maintenance-schedule.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanRawEntity } from '@infrastructure/database/entities/can-raw.entity';
import { CanRecordEntity } from '@infrastructure/database/entities/can-record.entity';
import { MaintenanceRecordEntity } from '@infrastructure/database/entities/maintenance-record.entity';
import { MaintenanceScheduleEntity } from '@infrastructure/database/entities/maintenance-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CanRawEntity, CanRecordEntity, MaintenanceRecordEntity, MaintenanceScheduleEntity]),
  ],
  providers: [CanRawRepository, CanRecordRepository, MaintenanceRecordRepository, MaintenanceScheduleRepository],
  exports: [CanRawRepository, CanRecordRepository, MaintenanceRecordRepository, MaintenanceScheduleRepository],
})
export class RepositoryModule {}
