import { Module } from '@nestjs/common';
import { CollectController } from './collect.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ServiceModule } from '@app/service/service.module';

@Module({
  imports: [ServiceModule],
  controllers: [CollectController],
  providers: [ApiKeyGuard],
})
export class ControllerModule {}
