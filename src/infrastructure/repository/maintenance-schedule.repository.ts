import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceSchedule } from '@app/domain/maintenance-schedule';
import { MaintenanceScheduleEntity } from '@infrastructure/database/entities/maintenance-schedule.entity';

@Injectable()
export class MaintenanceScheduleRepository {
  constructor(
    @InjectRepository(MaintenanceScheduleEntity)
    private readonly repo: Repository<MaintenanceScheduleEntity>
  ) {}

  async findAll(): Promise<MaintenanceSchedule[]> {
    const entities = await this.repo.find({ order: { type: 'ASC' } });
    return entities.map((e) => e.toDomain());
  }

  async update(schedule: MaintenanceSchedule): Promise<MaintenanceSchedule | null> {
    const result = await this.repo.update(
      { type: schedule.type },
      { intervalKm: schedule.intervalKm, warningKm: schedule.warningKm, enabled: schedule.enabled }
    );
    return result.affected ? schedule : null;
  }
}
