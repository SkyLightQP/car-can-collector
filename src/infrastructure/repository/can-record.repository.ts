import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CanRecord } from '@app/domain/can-record';
import { CanRecordEntity } from '@infrastructure/database/entities/can-record.entity';

@Injectable()
export class CanRecordRepository {
  constructor(
    @InjectRepository(CanRecordEntity)
    private readonly repo: Repository<CanRecordEntity>
  ) {}

  async saveAll(records: CanRecord[]): Promise<void> {
    if (records.length === 0) return;
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(CanRecordEntity)
      .values(records.map((r) => CanRecordEntity.fromDomain(r)))
      .orIgnore()
      .execute();
  }

  async findLatestPerDevice(): Promise<CanRecord[]> {
    const entities = await this.repo
      .createQueryBuilder('r')
      .distinctOn(['r.deviceId'])
      .orderBy('r.deviceId', 'ASC')
      .addOrderBy('r.timestamp', 'DESC')
      .getMany();

    return entities.map((e) => e.toDomain());
  }
}
