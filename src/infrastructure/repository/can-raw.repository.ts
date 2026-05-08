import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CanRaw } from '@app/domain/can-raw';
import { CanRawEntity } from '@infrastructure/database/entities/can-raw.entity';

@Injectable()
export class CanRawRepository {
  constructor(
    @InjectRepository(CanRawEntity)
    private readonly repo: Repository<CanRawEntity>
  ) {}

  async saveAll(frames: CanRaw[]): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(CanRawEntity)
      .values(frames.map((frame) => CanRawEntity.fromDomain(frame)))
      .orIgnore()
      .execute();
  }
}
