import { Module } from '@nestjs/common';
import { CanRawRepository } from '@infrastructure/repository/can-raw.repository';
import { CanRecordRepository } from '@infrastructure/repository/can-record.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanRawEntity } from '@infrastructure/database/entities/can-raw.entity';
import { CanRecordEntity } from '@infrastructure/database/entities/can-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CanRawEntity, CanRecordEntity])],
  providers: [CanRawRepository, CanRecordRepository],
  exports: [CanRawRepository, CanRecordRepository],
})
export class RepositoryModule {}
