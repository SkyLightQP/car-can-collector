import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { AuthModule } from '@infrastructure/auth/auth.module';
import { ControllerModule } from '@app/controller/controller.module';
import { TrpcModule } from '@app/trpc/trpc.module';
import { McpModule } from '@app/mcp/mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ControllerModule,
    TrpcModule,
    McpModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
