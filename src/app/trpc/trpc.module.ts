import { Module } from '@nestjs/common';
import { ServiceModule } from '@app/service/service.module';
import { VehicleQueryService } from '@app/service/query/vehicle-query.service';
import { TripQueryService } from '@app/service/query/trip-query.service';
import { MaintenanceService } from '@app/service/maintenance.service';
import { ApiKeyService } from '@app/service/api-key.service';
import { createAppRouter } from './app.router';

export const APP_ROUTER = Symbol('APP_ROUTER');

@Module({
  imports: [ServiceModule],
  providers: [
    {
      provide: APP_ROUTER,
      inject: [VehicleQueryService, TripQueryService, MaintenanceService, ApiKeyService],
      useFactory: (
        vehicle: VehicleQueryService,
        trips: TripQueryService,
        maintenance: MaintenanceService,
        apiKeys: ApiKeyService
      ) => createAppRouter({ vehicle, trips, maintenance, apiKeys }),
    },
  ],
  exports: [APP_ROUTER],
})
export class TrpcModule {}
