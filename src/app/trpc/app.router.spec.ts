import { createCallerFactory } from './trpc';
import { createAppRouter } from './app.router';

const user = { id: 'user-1', email: 'me@example.com', name: '나' };

function setup() {
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
  return { appRouter, getStatus, getLast, listRecords };
}

describe('appRouter', () => {
  it('vehicle, trips, maintenance 네임스페이스로 각 기능에 위임한다', async () => {
    const { appRouter, getStatus, getLast, listRecords } = setup();
    const caller = createCallerFactory(appRouter)({ user });

    await expect(caller.vehicle.status()).resolves.toBeNull();
    await expect(caller.trips.last()).resolves.toBeNull();
    await expect(caller.maintenance.records.list()).resolves.toEqual([]);
    expect(getStatus).toHaveBeenCalledTimes(1);
    expect(getLast).toHaveBeenCalledTimes(1);
    expect(listRecords).toHaveBeenCalledTimes(1);
  });

  it('로그인하지 않은 호출은 모든 네임스페이스에서 UNAUTHORIZED 이고 기능을 호출하지 않는다', async () => {
    const { appRouter, getStatus, getLast, listRecords } = setup();
    const caller = createCallerFactory(appRouter)({ user: null });

    await expect(caller.vehicle.status()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(caller.trips.last()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(caller.maintenance.records.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(getStatus).not.toHaveBeenCalled();
    expect(getLast).not.toHaveBeenCalled();
    expect(listRecords).not.toHaveBeenCalled();
  });
});
