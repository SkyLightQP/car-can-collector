import { Injectable } from '@nestjs/common';
import { CanRaw } from '@app/domain/can-raw';
import { CanRawRepository } from '@infrastructure/repository/can-raw.repository';

@Injectable()
export class CanCollectorService {
  constructor(private readonly canRawRepository: CanRawRepository) {}

  async collect(frames: CanRaw[]): Promise<void> {
    await this.canRawRepository.saveAll(frames);
  }
}
