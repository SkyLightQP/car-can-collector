import { Module } from '@nestjs/common';
import { CanCollectorService } from '@app/service/can-collector.service';
import { RepositoryModule } from '@infrastructure/repository/repository.module';
import { CanDecodeService } from '@app/service/can-decode.service';

@Module({
  imports: [RepositoryModule],
  providers: [CanCollectorService, CanDecodeService],
  exports: [CanCollectorService, CanDecodeService],
})
export class ServiceModule {}
