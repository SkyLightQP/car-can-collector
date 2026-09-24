/**
 * car-can-dashboard 에 공개하는 타입 진입점. `pnpm run build:types` 가 이 파일에서 d.ts 를 만든다.
 *
 * 산출물에는 런타임 JS 가 없으므로 타입만 export 한다.
 * 여기서 도달 가능한 파일은 상대 경로와 zod/@trpc/server 만 import 해야 한다.
 */
export type { AppRouter } from './app.router';
export type { BatteryHistory, BatteryHistoryInput, VehicleStatus } from './schemas/vehicle.schema';
export type {
  DailyTrip,
  DailyTrips,
  DailyTripsInput,
  LastTrip,
  WeeklyTrip,
  WeeklyTrips,
  WeeklyTripsInput,
} from './schemas/trips.schema';
