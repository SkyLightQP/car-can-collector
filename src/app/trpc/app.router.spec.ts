import { createCallerFactory } from './trpc';
import { createAppRouter } from './app.router';

describe('appRouter', () => {
  it('vehicle, trips, maintenance 네임스페이스로 각 기능에 위임한다', async () => {
    const getStatus = jest.fn().mockResolvedValue(null);
    const getLast = jest.fn().mockResolvedValue(null);
    const listRecords = jest.fn().mockResolvedValue([]);
    const appRouter = createAppRouter({
      vehicle: { getStatus, getBatteryHistory: jest.fn() },
      trips: { getDaily: jest.fn(), getLast, getWeekly: jest.fn() },
      maintenance: {
        getAlerts: jest.fn(),
        listRecords,
        createRecord: jest.fn(),
        updateRecord: jest.fn(),
        deleteRecord: jest.fn(),
        listSchedules: jest.fn(),
        updateSchedule: jest.fn(),
      },
    });
    const caller = createCallerFactory(appRouter)({});

    await expect(caller.vehicle.status()).resolves.toBeNull();
    await expect(caller.trips.last()).resolves.toBeNull();
    await expect(caller.maintenance.records.list()).resolves.toEqual([]);
    expect(getStatus).toHaveBeenCalledTimes(1);
    expect(getLast).toHaveBeenCalledTimes(1);
    expect(listRecords).toHaveBeenCalledTimes(1);
  });
});
