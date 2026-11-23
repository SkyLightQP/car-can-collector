import { Logger } from '@nestjs/common';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { summarizeDriveSessions } from '@app/domain/trip/drive-session-summary';
import type { VehicleQueries } from '@app/trpc/routers/vehicle.router';
import type { TripQueries } from '@app/trpc/routers/trips.router';
import type { MaintenanceOperations } from '@app/trpc/routers/maintenance.router';
import { batteryHistoryInputSchema } from '@app/trpc/schemas/vehicle.schema';
import { dailyTripsInputSchema, driveReplayInputSchema, weeklyTripsInputSchema } from '@app/trpc/schemas/trips.schema';

export interface McpToolDeps {
  vehicle: VehicleQueries;
  trips: TripQueries;
  maintenance: Pick<MaintenanceOperations, 'getAlerts' | 'listRecords' | 'listSchedules'>;
}

const noInputSchema = z.object({});
const READ_ONLY = { readOnlyHint: true };
const QUERY_FAILED_MESSAGE = '조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

const mcpLogger = new Logger('MCP');

async function runQuery(toolName: string, query: () => Promise<unknown>) {
  try {
    const value = await query();
    return { content: [{ type: 'text' as const, text: JSON.stringify(value) }] };
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    mcpLogger.error(`${toolName} 실패: ${failure.message}`, failure.stack);
    return { content: [{ type: 'text' as const, text: QUERY_FAILED_MESSAGE }], isError: true };
  }
}

export function registerReadOnlyTools(server: McpServer, deps: McpToolDeps): void {
  const { vehicle, trips, maintenance } = deps;

  server.registerTool(
    'get_vehicle_status',
    {
      description:
        '차량의 최신 상태를 조회한다. 측정 시각, 시동 여부, 주행거리(km), 배터리 전압(V), 타이어 공기압(psi), TPMS 경고 상태를 포함하며 데이터가 없으면 null 이다.',
      inputSchema: noInputSchema,
      annotations: READ_ONLY,
    },
    () => runQuery('get_vehicle_status', () => vehicle.getStatus())
  );

  server.registerTool(
    'get_battery_history',
    {
      description: '최근 N일(1~90, 기본 7)의 일별 배터리 전압 이력을 조회한다. 날짜는 KST 기준 YYYY-MM-DD 이다.',
      inputSchema: batteryHistoryInputSchema,
      annotations: READ_ONLY,
    },
    (input) => runQuery('get_battery_history', () => vehicle.getBatteryHistory(input))
  );

  server.registerTool(
    'get_daily_trips',
    {
      description:
        'from 부터 to 까지(KST 날짜 YYYY-MM-DD, 최대 92일)의 일별 주행 요약을 조회한다. 거리(km), 평균/최고 속도(km/h), 주행 시간(분)을 돌려준다.',
      inputSchema: dailyTripsInputSchema,
      annotations: READ_ONLY,
    },
    (input) => runQuery('get_daily_trips', () => trips.getDaily(input))
  );

  server.registerTool(
    'get_last_trip',
    {
      description:
        '가장 최근 주행 한 건을 조회한다. 시작/종료 시각, 거리(km), 평균/최고 속도(km/h), 주행 시간(분)을 돌려주며 없으면 null 이다.',
      inputSchema: noInputSchema,
      annotations: READ_ONLY,
    },
    () => runQuery('get_last_trip', () => trips.getLast())
  );

  server.registerTool(
    'get_weekly_trips',
    {
      description:
        '최근 N주(1~26, 기본 6)의 주별 주행 요약을 조회한다. 주 시작일은 KST 월요일 YYYY-MM-DD, 거리(km), 평균 속도(km/h), 주행 시간(분)을 돌려준다.',
      inputSchema: weeklyTripsInputSchema,
      annotations: READ_ONLY,
    },
    (input) => runQuery('get_weekly_trips', () => trips.getWeekly(input))
  );

  server.registerTool(
    'get_drive_session_summaries',
    {
      description:
        '마지막 주행(last) 또는 오늘(today, KST)의 주행 세션별 요약을 조회한다. 거리(km), 평균/최고 속도(km/h), 급가속/급제동 횟수, 최대 브레이크 압력(bar), 최대 가속 페달(%)을 돌려준다.',
      inputSchema: driveReplayInputSchema,
      annotations: READ_ONLY,
    },
    (input) => runQuery('get_drive_session_summaries', async () => summarizeDriveSessions(await trips.getReplay(input)))
  );

  server.registerTool(
    'get_maintenance_alerts',
    {
      description: '정비 항목별 교체 알림을 조회한다. 마지막 정비 이후 주행거리(km)와 남은 거리(km) 기준으로 계산된다.',
      inputSchema: noInputSchema,
      annotations: READ_ONLY,
    },
    () => runQuery('get_maintenance_alerts', () => maintenance.getAlerts())
  );

  server.registerTool(
    'list_maintenance_records',
    {
      description:
        '정비 이력 목록을 조회한다. 정비 종류, 정비 당시 주행거리(km), 날짜(KST YYYY-MM-DD), 메모를 돌려준다.',
      inputSchema: noInputSchema,
      annotations: READ_ONLY,
    },
    () => runQuery('list_maintenance_records', () => maintenance.listRecords())
  );

  server.registerTool(
    'list_maintenance_schedules',
    {
      description: '정비 종류별 교체 주기 설정을 조회한다. 교체 주기(km), 경고 시점(km), 활성화 여부를 돌려준다.',
      inputSchema: noInputSchema,
      annotations: READ_ONLY,
    },
    () => runQuery('list_maintenance_schedules', () => maintenance.listSchedules())
  );
}
