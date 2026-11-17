import { Logger } from '@nestjs/common';
import { McpServer, InMemoryTransport, createMcpHandler } from '@modelcontextprotocol/server';
import { Client } from '@modelcontextprotocol/client';
import { registerReadOnlyTools } from './mcp-tools';

const TOOL_NAMES = [
  'get_vehicle_status',
  'get_battery_history',
  'get_daily_trips',
  'get_last_trip',
  'get_weekly_trips',
  'get_drive_session_summaries',
  'get_maintenance_alerts',
  'list_maintenance_records',
  'list_maintenance_schedules',
];

function createDeps() {
  return {
    vehicle: { getStatus: jest.fn().mockResolvedValue(null), getBatteryHistory: jest.fn().mockResolvedValue([]) },
    trips: {
      getDaily: jest.fn().mockResolvedValue([]),
      getLast: jest.fn().mockResolvedValue(null),
      getWeekly: jest.fn().mockResolvedValue([]),
      getReplay: jest.fn().mockResolvedValue([]),
    },
    maintenance: {
      getAlerts: jest.fn().mockResolvedValue([]),
      listRecords: jest.fn().mockResolvedValue([]),
      listSchedules: jest.fn().mockResolvedValue([]),
    },
  };
}

function textOf(result: unknown): string {
  return (result as { content: { text: string }[] }).content[0].text;
}

describe('registerReadOnlyTools', () => {
  let deps: ReturnType<typeof createDeps>;
  let client: Client;

  beforeEach(async () => {
    deps = createDeps();
    const server = new McpServer({ name: 'test', version: '1' });
    registerReadOnlyTools(server, deps);
    const [serverSide, clientSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    client = new Client({ name: 't', version: '1' });
    await client.connect(clientSide);
  });

  it('읽기 전용 도구 9개를 등록한다', async () => {
    const tools = (await client.listTools()).tools;

    expect(tools.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
    expect(tools.every((t) => t.annotations?.readOnlyHint === true)).toBe(true);
  });

  it('get_battery_history 는 days 를 생략하면 7일로 조회한다', async () => {
    await client.callTool({ name: 'get_battery_history', arguments: {} });

    expect(deps.vehicle.getBatteryHistory).toHaveBeenCalledWith({ days: 7 });
  });

  it('범위를 벗어난 입력은 서비스 호출 없이 isError 결과를 돌려준다', async () => {
    const overDays = await client.callTool({ name: 'get_battery_history', arguments: { days: 91 } });
    const reversed = await client.callTool({
      name: 'get_daily_trips',
      arguments: { from: '2026-02-10', to: '2026-02-01' },
    });

    expect(overDays.isError).toBe(true);
    expect(reversed.isError).toBe(true);
    expect(deps.vehicle.getBatteryHistory).not.toHaveBeenCalled();
    expect(deps.trips.getDaily).not.toHaveBeenCalled();
  });

  it('get_vehicle_status 는 데이터가 없으면 null 텍스트를 돌려준다', async () => {
    const result = await client.callTool({ name: 'get_vehicle_status', arguments: {} });

    expect(textOf(result)).toBe('null');
  });

  it('get_drive_session_summaries 는 리플레이 원본 대신 세션 요약을 돌려준다', async () => {
    const t0 = Date.parse('2026-01-01T00:00:00.000Z');
    deps.trips.getReplay.mockResolvedValue([
      {
        startedAt: new Date(t0).toISOString(),
        endedAt: new Date(t0 + 2000).toISOString(),
        points: [
          { t: t0, speedKph: 0, accelPct: 0, brakeBar: 0, steeringDeg: 0 },
          { t: t0 + 1000, speedKph: 20, accelPct: 50, brakeBar: 0, steeringDeg: 0 },
          { t: t0 + 2000, speedKph: 20, accelPct: 10, brakeBar: 0, steeringDeg: 0 },
        ],
      },
    ]);

    const result = await client.callTool({ name: 'get_drive_session_summaries', arguments: { range: 'last' } });
    const text = textOf(result);

    expect(deps.trips.getReplay).toHaveBeenCalledWith({ range: 'last' });
    expect(text).not.toContain('points');
    expect(text).toContain('hardAccelCount');
  });

  it('서비스가 실패하면 내부 오류 메시지 대신 일반 안내 문구로 isError 결과를 돌려주고 로그를 남긴다', async () => {
    const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    deps.vehicle.getStatus.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:5432'));

    const result = await client.callTool({ name: 'get_vehicle_status', arguments: {} });

    expect(result.isError).toBe(true);
    expect(textOf(result)).not.toContain('ECONNREFUSED');
    expect(textOf(result)).not.toContain('10.0.0.5');
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('ECONNREFUSED'), expect.any(String));
    logError.mockRestore();
  });
});

describe('stateless MCP HTTP 핸들러', () => {
  it('세션 없이 initialize 와 tools/call 을 각각 처리한다', async () => {
    const deps = createDeps();
    const handler = createMcpHandler(() => {
      const server = new McpServer({ name: 'car-can-collector', version: '0.0.1' });
      registerReadOnlyTools(server, deps);
      return server;
    });
    const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };

    const initialize = await handler.fetch(
      new Request('http://localhost/mcp', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 't', version: '1' } },
        }),
      })
    );
    const call = await handler.fetch(
      new Request('http://localhost/mcp', {
        method: 'POST',
        headers: { ...headers, 'mcp-protocol-version': '2025-11-25' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: { name: 'get_last_trip', arguments: {} },
        }),
      })
    );
    const callBody = await call.text();
    const get = await handler.fetch(new Request('http://localhost/mcp', { method: 'GET', headers }));
    await handler.close();

    expect(initialize.status).toBe(200);
    expect(call.status).toBe(200);
    expect(callBody).toContain('result');
    expect(get.status).toBe(405);
  });
});
