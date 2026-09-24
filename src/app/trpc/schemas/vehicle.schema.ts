import { z } from 'zod';

export const vehicleStatusSchema = z.object({
  measuredAt: z.iso.datetime(),
  /** 시동 중이면 batteryVoltageV 가 발전기 충전 전압(~14V)일 수 있다. */
  engineOn: z.boolean(),
  odometerKm: z.number(),
  batteryVoltageV: z.number(),
  /** 타이어 공기압(psi). null = 센서 미수신 */
  tires: z.object({
    frontLeft: z.number().nullable(),
    frontRight: z.number().nullable(),
    rearLeft: z.number().nullable(),
    rearRight: z.number().nullable(),
  }),
  tpmsWarnLamp: z.boolean(),
  tpmsStatus: z.string(),
});
export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;

/**
 * 입력을 생략해도(`query()`) 기본값이 적용되도록 prefault 를 쓴다.
 * zod v4 의 default 는 기본값을 파싱하지 않고 그대로 돌려주므로 내부 필드 default 가 적용되지 않는다.
 */
export const batteryHistoryInputSchema = z
  .object({
    days: z.int().min(1).max(90).default(7),
  })
  .prefault({});
export type BatteryHistoryInput = z.infer<typeof batteryHistoryInputSchema>;

export const batteryHistorySchema = z.array(
  z.object({
    date: z.iso.date(),
    /** 그 날 시동 OFF 레코드의 평균 전압. 없으면 null */
    voltageV: z.number().nullable(),
  })
);
export type BatteryHistory = z.infer<typeof batteryHistorySchema>;
