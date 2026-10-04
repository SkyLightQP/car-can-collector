import { router } from './trpc';
import { createMaintenanceRouter, type MaintenanceOperations } from './routers/maintenance.router';
import { createTripsRouter, type TripQueries } from './routers/trips.router';
import { createVehicleRouter, type VehicleQueries } from './routers/vehicle.router';

export interface AppRouterDeps {
  vehicle: VehicleQueries;
  trips: TripQueries;
  maintenance: MaintenanceOperations;
}

export function createAppRouter(deps: AppRouterDeps) {
  return router({
    vehicle: createVehicleRouter(deps.vehicle),
    trips: createTripsRouter(deps.trips),
    maintenance: createMaintenanceRouter(deps.maintenance),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
