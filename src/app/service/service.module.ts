import { Module } from '@nestjs/common';
import { CanCollectorService } from '@app/service/can-collector.service';
import { RepositoryModule } from '@infrastructure/repository/repository.module';

@Module({
  imports: [RepositoryModule],
  providers: [CanCollectorService],
  exports: [CanCollectorService],
})
export class ServiceModule {}
