import { Module } from '@nestjs/common';
import { CanCollectorService } from '@app/service/can-collector.service';
import { RepositoryModule } from '@infrastructure/repository/repository.module';
import { CanDecodeService } from '@app/service/can-decode.service';
import { VehicleQueryService } from '@app/service/vehicle-query.service';

@Module({
  imports: [RepositoryModule],
  providers: [CanCollectorService, CanDecodeService, VehicleQueryService],
  exports: [CanCollectorService, CanDecodeService, VehicleQueryService],
})
export class ServiceModule {}
