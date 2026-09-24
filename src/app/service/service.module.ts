import { Module } from '@nestjs/common';
import { CanCollectorService } from '@app/service/can-collector.service';
import { RepositoryModule } from '@infrastructure/repository/repository.module';
import { CanDecodeService } from '@app/service/can-decode.service';
import { VehicleQueryService } from '@app/service/vehicle-query.service';
import { TripQueryService } from '@app/service/trip-query.service';

@Module({
  imports: [RepositoryModule],
  providers: [CanCollectorService, CanDecodeService, VehicleQueryService, TripQueryService],
  exports: [CanCollectorService, CanDecodeService, VehicleQueryService, TripQueryService],
})
export class ServiceModule {}
