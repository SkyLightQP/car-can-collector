import { publicProcedure, router } from '../trpc';
import {
  type BatteryHistory,
  type BatteryHistoryInput,
  batteryHistoryInputSchema,
  batteryHistorySchema,
  type VehicleStatus,
  vehicleStatusSchema,
} from '../schemas/vehicle.schema';

export interface VehicleQueries {
  getStatus(): Promise<VehicleStatus | null>;
  getBatteryHistory(input: BatteryHistoryInput): Promise<BatteryHistory>;
}

export function createVehicleRouter(queries: VehicleQueries) {
  return router({
    status: publicProcedure.output(vehicleStatusSchema.nullable()).query(() => queries.getStatus()),
    batteryHistory: publicProcedure
      .input(batteryHistoryInputSchema)
      .output(batteryHistorySchema)
      .query(({ input }) => queries.getBatteryHistory(input)),
  });
}
