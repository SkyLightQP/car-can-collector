import { MaintenanceRecord } from '@app/domain/maintenance-record';
import { MaintenanceSchedule } from '@app/domain/maintenance-schedule';
import type { CanRecordRepository } from '@infrastructure/repository/can-record.repository';
import type { MaintenanceRecordRepository } from '@infrastructure/repository/maintenance-record.repository';
import type { MaintenanceScheduleRepository } from '@infrastructure/repository/maintenance-schedule.repository';
import { MaintenanceService } from './maintenance.service';

const RECORD_ID = '3f0c9a52-8d4e-4b7a-9c61-2e5f7a1b4d90';

const recordFields = {
  type: 'engine_oil',
  item: '엔진오일 교환',
  performedOn: '2026-05-02',
  odometerKm: 43120,
  costKrw: 92000,
  note: '합성유',
} as const;

const oilChange = MaintenanceRecord.from({ id: RECORD_ID, ...recordFields });

const engineOil = MaintenanceSchedule.from({ type: 'engine_oil', intervalKm: 10000, warningKm: 1500, enabled: true });
const brakePad = MaintenanceSchedule.from({ type: 'brake_pad', intervalKm: 20000, warningKm: 3000, enabled: true });
const brakeFluid = MaintenanceSchedule.from({
  type: 'brake_fluid',
  intervalKm: 40000,
  warningKm: 5000,
  enabled: false,
});

function setup() {
  const records = {
    findAll: jest.fn().mockResolvedValue([oilChange]),
    findLatestPerType: jest.fn().mockResolvedValue([oilChange]),
    create: jest.fn().mockResolvedValue(oilChange),
    update: jest.fn().mockResolvedValue(oilChange),
    delete: jest.fn().mockResolvedValue(true),
  };
  const schedules = {
    findAll: jest.fn().mockResolvedValue([brakePad, brakeFluid, engineOil]),
    update: jest
      .fn<Promise<MaintenanceSchedule | null>, [MaintenanceSchedule]>()
      .mockImplementation((schedule) => Promise.resolve(schedule)),
  };
  const canRecords = {
    findLatest: jest.fn().mockResolvedValue({ odometerKm: 48213.6 }),
  };
  const service = new MaintenanceService(
    records as unknown as MaintenanceRecordRepository,
    schedules as unknown as MaintenanceScheduleRepository,
    canRecords as unknown as CanRecordRepository
  );
  return { service, records, schedules, canRecords };
}

describe('MaintenanceService', () => {
  describe('getAlerts', () => {
    it('활성화된 주기마다 해당 타입의 최신 이력으로 알림을 만들고 현재 주행거리는 반올림한다', async () => {
      const { service } = setup();
      await expect(service.getAlerts()).resolves.toEqual({
        currentOdometerKm: 48214,
        alerts: [
          {
            type: 'brake_pad',
            intervalKm: 20000,
            warningKm: 3000,
            lastRecord: null,
            dueAtKm: null,
            remainingKm: null,
            status: 'warning',
          },
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
      });
    });

    it('CAN 기록이 없으면 현재 주행거리는 null', async () => {
      const { service, canRecords } = setup();
      canRecords.findLatest.mockResolvedValue(null);
      const result = await service.getAlerts();
      expect(result.currentOdometerKm).toBeNull();
      expect(result.alerts.find((alert) => alert.type === 'engine_oil')).toMatchObject({
        remainingKm: null,
        status: null,
      });
    });

    it('최신 CAN 기록의 odometer 가 0(수신 전 초기값)이면 현재 주행거리는 null', async () => {
      const { service, canRecords } = setup();
      canRecords.findLatest.mockResolvedValue({ odometerKm: 0 });
      const result = await service.getAlerts();
      expect(result.currentOdometerKm).toBeNull();
      expect(result.alerts.find((alert) => alert.type === 'engine_oil')).toMatchObject({ status: null });
    });
  });

  describe('records', () => {
    it('listRecords 는 이력을 응답 형태로 변환한다', async () => {
      const { service } = setup();
      await expect(service.listRecords()).resolves.toEqual([{ id: RECORD_ID, ...recordFields }]);
    });

    it('createRecord 는 필드를 저장하고 생성된 이력을 반환한다', async () => {
      const { service, records } = setup();
      await expect(service.createRecord(recordFields)).resolves.toEqual({ id: RECORD_ID, ...recordFields });
      expect(records.create).toHaveBeenCalledWith(recordFields);
    });

    it('updateRecord 는 id 와 필드를 나눠 전달한다', async () => {
      const { service, records } = setup();
      await expect(service.updateRecord({ id: RECORD_ID, ...recordFields })).resolves.toEqual({
        id: RECORD_ID,
        ...recordFields,
      });
      expect(records.update).toHaveBeenCalledWith(RECORD_ID, recordFields);
    });

    it('updateRecord 대상이 없으면 null', async () => {
      const { service, records } = setup();
      records.update.mockResolvedValue(null);
      await expect(service.updateRecord({ id: RECORD_ID, ...recordFields })).resolves.toBeNull();
    });

    it('deleteRecord 는 삭제되면 id 를, 대상이 없으면 null 을 반환한다', async () => {
      const { service, records } = setup();
      await expect(service.deleteRecord({ id: RECORD_ID })).resolves.toEqual({ id: RECORD_ID });
      expect(records.delete).toHaveBeenCalledWith(RECORD_ID);

      records.delete.mockResolvedValue(false);
      await expect(service.deleteRecord({ id: RECORD_ID })).resolves.toBeNull();
    });
  });

  describe('schedules', () => {
    it('listSchedules 는 비활성 주기까지 모두 반환한다', async () => {
      const { service } = setup();
      await expect(service.listSchedules()).resolves.toEqual([
        { type: 'brake_pad', intervalKm: 20000, warningKm: 3000, enabled: true },
        { type: 'brake_fluid', intervalKm: 40000, warningKm: 5000, enabled: false },
        { type: 'engine_oil', intervalKm: 10000, warningKm: 1500, enabled: true },
      ]);
    });

    it('updateSchedule 은 입력을 도메인으로 저장하고 결과를 반환한다', async () => {
      const { service, schedules } = setup();
      const input = { type: 'engine_oil', intervalKm: 8000, warningKm: 1000, enabled: false } as const;
      await expect(service.updateSchedule(input)).resolves.toEqual(input);
      const [saved] = schedules.update.mock.calls[0];
      expect([saved.type, saved.intervalKm, saved.warningKm, saved.enabled]).toEqual(['engine_oil', 8000, 1000, false]);
    });

    it('updateSchedule 대상이 없으면 null', async () => {
      const { service, schedules } = setup();
      schedules.update.mockResolvedValue(null);
      await expect(
        service.updateSchedule({ type: 'engine_oil', intervalKm: 8000, warningKm: 1000, enabled: true })
      ).resolves.toBeNull();
    });
  });
});
