import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { ControllerModule } from '@app/controller/controller.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, ControllerModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
