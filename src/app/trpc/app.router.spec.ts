import { createCallerFactory } from './trpc';
import { createAppRouter } from './app.router';

describe('appRouter', () => {
  it('vehicle 과 trips 네임스페이스로 각 조회 기능에 위임한다', async () => {
    const getStatus = jest.fn().mockResolvedValue(null);
    const getLast = jest.fn().mockResolvedValue(null);
    const appRouter = createAppRouter({
      vehicle: { getStatus, getBatteryHistory: jest.fn() },
      trips: { getDaily: jest.fn(), getLast, getWeekly: jest.fn() },
    });
    const caller = createCallerFactory(appRouter)({});

    await expect(caller.vehicle.status()).resolves.toBeNull();
    await expect(caller.trips.last()).resolves.toBeNull();
    expect(getStatus).toHaveBeenCalledTimes(1);
    expect(getLast).toHaveBeenCalledTimes(1);
  });
});
