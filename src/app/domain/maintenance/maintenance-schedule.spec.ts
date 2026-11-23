import { MaintenanceRecord } from './maintenance-record';
import { MaintenanceSchedule } from './maintenance-schedule';

const RECORD_ID = '3f0c9a52-8d4e-4b7a-9c61-2e5f7a1b4d90';

const engineOil = MaintenanceSchedule.from({ type: 'engine_oil', intervalKm: 10000, warningKm: 1500, enabled: true });

const lastOilChange = MaintenanceRecord.from({
  id: RECORD_ID,
  type: 'engine_oil',
  item: '엔진오일 교환',
  performedOn: '2026-05-02',
  odometerKm: 43120,
  costKrw: 92000,
  note: '',
});

describe('MaintenanceSchedule.alertFor', () => {
  it('정비 이력이 없으면 warning 이고 남은 거리는 계산하지 않는다', () => {
    expect(engineOil.alertFor(null, 48214)).toEqual({
      type: 'engine_oil',
      intervalKm: 10000,
      warningKm: 1500,
      lastRecord: null,
      dueAtKm: null,
      remainingKm: null,
      status: 'warning',
    });
  });

  it('이력이 있으면 마지막 정비 주행거리 + 주기로 도래 시점을 계산한다', () => {
    expect(engineOil.alertFor(lastOilChange, 48214)).toEqual({
      type: 'engine_oil',
      intervalKm: 10000,
      warningKm: 1500,
      lastRecord: { id: RECORD_ID, performedOn: '2026-05-02', odometerKm: 43120 },
      dueAtKm: 53120,
      remainingKm: 4906,
      status: 'normal',
    });
  });

  it('현재 주행거리를 모르면 도래 시점만 주고 남은 거리와 상태는 null', () => {
    expect(engineOil.alertFor(lastOilChange, null)).toMatchObject({
      dueAtKm: 53120,
      remainingKm: null,
      status: null,
    });
  });

  it.each<[number, number, string]>([
    [51619, 1501, 'normal'],
    [51620, 1500, 'warning'],
    [53120, 0, 'warning'],
    [53121, -1, 'critical'],
  ])('현재 %p km 이면 남은 거리 %p, 상태 %p', (currentOdometerKm, remainingKm, status) => {
    expect(engineOil.alertFor(lastOilChange, currentOdometerKm)).toMatchObject({ remainingKm, status });
  });
});
