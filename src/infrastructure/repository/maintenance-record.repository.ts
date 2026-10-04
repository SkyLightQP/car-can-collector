import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceRecord, type MaintenanceRecordFields } from '@app/domain/maintenance-record';
import { MaintenanceRecordEntity } from '@infrastructure/database/entities/maintenance-record.entity';

@Injectable()
export class MaintenanceRecordRepository {
  constructor(
    @InjectRepository(MaintenanceRecordEntity)
    private readonly repo: Repository<MaintenanceRecordEntity>
  ) {}

  async findAll(): Promise<MaintenanceRecord[]> {
    const entities = await this.repo.find({ order: { performedOn: 'DESC', odometerKm: 'DESC' } });
    return entities.map((e) => e.toDomain());
  }

  async findLatestPerType(): Promise<MaintenanceRecord[]> {
    const entities = await this.repo
      .createQueryBuilder('r')
      .distinctOn(['r.type'])
      .orderBy('r.type', 'ASC')
      .addOrderBy('r.odometerKm', 'DESC')
      .addOrderBy('r.performedOn', 'DESC')
      .getMany();

    return entities.map((e) => e.toDomain());
  }

  async create(fields: MaintenanceRecordFields): Promise<MaintenanceRecord> {
    const entity = await this.repo.save(this.repo.create(fields));
    return entity.toDomain();
  }

  async update(id: string, fields: MaintenanceRecordFields): Promise<MaintenanceRecord | null> {
    const result = await this.repo.update({ id }, fields);
    if (!result.affected) return null;

    const entity = await this.repo.findOneBy({ id });
    return entity?.toDomain() ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
