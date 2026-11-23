import { router } from './trpc';
import { type ApiKeyOperations, createApiKeyRouter } from './routers/api-key.router';
import { createMaintenanceRouter, type MaintenanceOperations } from './routers/maintenance.router';
import { createOAuthConnectionRouter, type OAuthConnectionOperations } from './routers/oauth-connection.router';
import { createTripsRouter, type TripQueries } from './routers/trips.router';
import { createVehicleRouter, type VehicleQueries } from './routers/vehicle.router';

export interface AppRouterDeps {
  vehicle: VehicleQueries;
  trips: TripQueries;
  maintenance: MaintenanceOperations;
  apiKeys: ApiKeyOperations;
  oauthConnections: OAuthConnectionOperations;
}

export function createAppRouter(deps: AppRouterDeps) {
  return router({
    vehicle: createVehicleRouter(deps.vehicle),
    trips: createTripsRouter(deps.trips),
    maintenance: createMaintenanceRouter(deps.maintenance),
    apiKeys: createApiKeyRouter(deps.apiKeys),
    oauthConnections: createOAuthConnectionRouter(deps.oauthConnections),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
