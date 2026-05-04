import { Module } from '@nestjs/common';
import { CanCollectorController } from './can-collector.controller';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  controllers: [CanCollectorController],
  providers: [ApiKeyGuard],
})
export class ControllerModule {}
