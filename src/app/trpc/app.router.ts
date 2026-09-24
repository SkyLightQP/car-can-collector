import { router } from './trpc';
import { createTripsRouter, type TripQueries } from './routers/trips.router';
import { createVehicleRouter, type VehicleQueries } from './routers/vehicle.router';

export interface AppRouterDeps {
  vehicle: VehicleQueries;
  trips: TripQueries;
}

export function createAppRouter(deps: AppRouterDeps) {
  return router({
    vehicle: createVehicleRouter(deps.vehicle),
    trips: createTripsRouter(deps.trips),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
