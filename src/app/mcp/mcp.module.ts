import { Logger, Module } from '@nestjs/common';
import { McpServer, createMcpHandler } from '@modelcontextprotocol/server';
import { ServiceModule } from '@app/service/service.module';
import { VehicleQueryService } from '@app/service/query/vehicle-query.service';
import { TripQueryService } from '@app/service/query/trip-query.service';
import { MaintenanceService } from '@app/service/maintenance.service';
import { registerReadOnlyTools } from './mcp-tools';

export const MCP_HTTP_HANDLER = Symbol('MCP_HTTP_HANDLER');

const mcpLogger = new Logger('MCP');

@Module({
  imports: [ServiceModule],
  providers: [
    {
      provide: MCP_HTTP_HANDLER,
      inject: [VehicleQueryService, TripQueryService, MaintenanceService],
      useFactory: (vehicle: VehicleQueryService, trips: TripQueryService, maintenance: MaintenanceService) =>
        createMcpHandler(
          () => {
            const server = new McpServer({ name: 'car-can-collector', version: '0.0.1' });
            registerReadOnlyTools(server, { vehicle, trips, maintenance });
            return server;
          },
          { onerror: (error) => mcpLogger.error(`MCP 요청 처리 실패: ${error.message}`, error.stack) }
        ),
    },
  ],
  exports: [MCP_HTTP_HANDLER],
})
export class McpModule {}
