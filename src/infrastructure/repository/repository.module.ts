import { Module } from '@nestjs/common';
import { CanRawRepository } from '@infrastructure/repository/can-raw.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanRawEntity } from '@infrastructure/database/entities/can-raw.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CanRawEntity])],
  providers: [CanRawRepository],
  exports: [CanRawRepository],
})
export class RepositoryModule {}
