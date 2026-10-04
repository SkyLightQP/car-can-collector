import { Module } from '@nestjs/common';
import { CanCollectorService } from '@app/service/can-collector.service';
import { RepositoryModule } from '@infrastructure/repository/repository.module';
import { CanDecodeService } from '@app/service/can-decode.service';
import { VehicleQueryService } from '@app/service/query/vehicle-query.service';
import { TripQueryService } from '@app/service/query/trip-query.service';
import { MaintenanceService } from '@app/service/maintenance.service';

@Module({
  imports: [RepositoryModule],
  providers: [CanCollectorService, CanDecodeService, VehicleQueryService, TripQueryService, MaintenanceService],
  exports: [CanCollectorService, CanDecodeService, VehicleQueryService, TripQueryService, MaintenanceService],
})
export class ServiceModule {}
