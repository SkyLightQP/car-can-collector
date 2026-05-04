import { Module } from '@nestjs/common';
import { CanCollectorController } from './can-collector.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ServiceModule } from '@app/service/service.module';

@Module({
  imports: [ServiceModule],
  controllers: [CanCollectorController],
  providers: [ApiKeyGuard],
})
export class ControllerModule {}
