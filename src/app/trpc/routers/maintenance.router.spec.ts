import { createCallerFactory } from '../trpc';
import type {
  CreateMaintenanceRecordInput,
  MaintenanceAlerts,
  MaintenanceRecordView,
  MaintenanceScheduleView,
} from '@app/trpc';
import { createMaintenanceRouter, type MaintenanceOperations } from './maintenance.router';

const user = { id: 'user-1', email: 'me@example.com', name: '나' };

const RECORD_ID = '3f0c9a52-8d4e-4b7a-9c61-2e5f7a1b4d90';

const recordInput: CreateMaintenanceRecordInput = {
  type: 'engine_oil',
  item: '엔진오일 교환',
  performedOn: '2026-05-02',
  odometerKm: 43120,
  costKrw: 92000,
  note: '합성유',
};

const record: MaintenanceRecordView = { id: RECORD_ID, ...recordInput };

const schedule: MaintenanceScheduleView = { type: 'engine_oil', intervalKm: 10000, warningKm: 1500, enabled: true };

const alerts: MaintenanceAlerts = {
  currentOdometerKm: 48214,
  alerts: [
    {
      type: 'engine_oil',
      intervalKm: 10000,
      warningKm: 1500,
      lastRecord: { id: RECORD_ID, performedOn: '2026-05-02', odometerKm: 43120 },
      dueAtKm: 53120,
      remainingKm: 4906,
      status: 'normal',
    },
  ],
};

function setup() {
  const operations = {
    getAlerts: jest.fn().mockResolvedValue(alerts),
    listRecords: jest.fn().mockResolvedValue([record]),
    createRecord: jest.fn().mockResolvedValue(record),
    updateRecord: jest.fn().mockResolvedValue(record),
    deleteRecord: jest.fn().mockResolvedValue({ id: RECORD_ID }),
    listSchedules: jest.fn().mockResolvedValue([schedule]),
    updateSchedule: jest.fn().mockResolvedValue(schedule),
  } satisfies MaintenanceOperations;
  const caller = createCallerFactory(createMaintenanceRouter(operations))({ user });
  return { caller, ...operations };
}

describe('maintenance router', () => {
  describe('alerts', () => {
    it('알림 계산 결과를 그대로 반환한다', async () => {
      const { caller } = setup();
      await expect(caller.alerts()).resolves.toEqual(alerts);
    });

    it('현재 주행거리를 모르면 status 와 remainingKm 을 null 로 반환한다', async () => {
      const { caller, getAlerts } = setup();
      const unknownOdometer: MaintenanceAlerts = {
        currentOdometerKm: null,
        alerts: [{ ...alerts.alerts[0], remainingKm: null, status: null }],
      };
      getAlerts.mockResolvedValue(unknownOdometer);
      await expect(caller.alerts()).resolves.toEqual(unknownOdometer);
    });
  });

  describe('records.list', () => {
    it('이력 목록을 반환한다', async () => {
      const { caller } = setup();
      await expect(caller.records.list()).resolves.toEqual([record]);
    });
  });

  describe('records.create', () => {
    it('item 을 trim 하고 note 가 없으면 빈 문자열로 전달한다', async () => {
      const { caller, createRecord } = setup();
      await caller.records.create({
        type: 'engine_oil',
        item: '  엔진오일 교환  ',
        performedOn: '2026-05-02',
        odometerKm: 43120,
        costKrw: 92000,
      });
      expect(createRecord).toHaveBeenCalledWith({ ...recordInput, note: '' });
    });

    it('생성된 이력을 반환한다', async () => {
      const { caller } = setup();
      await expect(caller.records.create(recordInput)).resolves.toEqual(record);
    });

    it.each<Record<string, unknown>>([
      { item: '   ' },
      { item: 'a'.repeat(101) },
      { note: 'a'.repeat(1001) },
      { type: 'wiper' },
      { performedOn: '2026-13-01' },
      { performedOn: '1999-12-31' },
      { odometerKm: -1 },
      { odometerKm: 1.5 },
      { odometerKm: 2147483648 },
      { costKrw: -1 },
      { costKrw: 2147483648 },
    ])('%p 는 BAD_REQUEST 로 거절한다', async (override) => {
      const { caller, createRecord } = setup();
      const input = { ...recordInput, ...override };
      await expect(caller.records.create(input)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      expect(createRecord).not.toHaveBeenCalled();
    });
  });

  describe('records.update', () => {
    it('id 와 전체 필드를 전달하고 수정된 이력을 반환한다', async () => {
      const { caller, updateRecord } = setup();
      await expect(caller.records.update({ id: RECORD_ID, ...recordInput })).resolves.toEqual(record);
      expect(updateRecord).toHaveBeenCalledWith({ id: RECORD_ID, ...recordInput });
    });

    it('없는 id 면 NOT_FOUND', async () => {
      const { caller, updateRecord } = setup();
      updateRecord.mockResolvedValue(null);
      await expect(caller.records.update({ id: RECORD_ID, ...recordInput })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('uuid 형식이 아니면 BAD_REQUEST', async () => {
      const { caller, updateRecord } = setup();
      await expect(caller.records.update({ id: 'mr-1', ...recordInput })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
      expect(updateRecord).not.toHaveBeenCalled();
    });
  });

  describe('records.delete', () => {
    it('삭제한 id 를 반환한다', async () => {
      const { caller, deleteRecord } = setup();
      await expect(caller.records.delete({ id: RECORD_ID })).resolves.toEqual({ id: RECORD_ID });
      expect(deleteRecord).toHaveBeenCalledWith({ id: RECORD_ID });
    });

    it('없는 id 면 NOT_FOUND', async () => {
      const { caller, deleteRecord } = setup();
      deleteRecord.mockResolvedValue(null);
      await expect(caller.records.delete({ id: RECORD_ID })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('uuid 형식이 아니면 BAD_REQUEST', async () => {
      const { caller, deleteRecord } = setup();
      await expect(caller.records.delete({ id: 'mr-1' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      expect(deleteRecord).not.toHaveBeenCalled();
    });
  });

  describe('schedules', () => {
    it('list 는 주기 설정 목록을 반환한다', async () => {
      const { caller } = setup();
      await expect(caller.schedules.list()).resolves.toEqual([schedule]);
    });

    it('update 는 입력을 전달하고 수정된 설정을 반환한다', async () => {
      const { caller, updateSchedule } = setup();
      await expect(caller.schedules.update(schedule)).resolves.toEqual(schedule);
      expect(updateSchedule).toHaveBeenCalledWith(schedule);
    });

    it('warningKm 이 intervalKm 과 같으면 허용한다', async () => {
      const { caller, updateSchedule } = setup();
      await caller.schedules.update({ ...schedule, warningKm: 10000 });
      expect(updateSchedule).toHaveBeenCalledWith({ ...schedule, warningKm: 10000 });
    });

    it.each<Record<string, unknown>>([
      { warningKm: 10001 },
      { intervalKm: 0 },
      { warningKm: -1 },
      { intervalKm: 2147483648 },
      { type: 'other' },
    ])('%p 는 BAD_REQUEST 로 거절한다', async (override) => {
      const { caller, updateSchedule } = setup();
      const input = { ...schedule, ...override };
      await expect(caller.schedules.update(input)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      expect(updateSchedule).not.toHaveBeenCalled();
    });

    it('설정 행이 없으면 NOT_FOUND', async () => {
      const { caller, updateSchedule } = setup();
      updateSchedule.mockResolvedValue(null);
      await expect(caller.schedules.update(schedule)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
