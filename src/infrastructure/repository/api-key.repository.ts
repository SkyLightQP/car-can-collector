import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '@app/domain/api-key';
import { ApiKeyEntity } from '@infrastructure/database/entities/api-key.entity';

export interface NewApiKey {
  name: string;
  keyHash: string;
  keyPrefix: string;
}

@Injectable()
export class ApiKeyRepository {
  constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly repo: Repository<ApiKeyEntity>
  ) {}

  async findAll(): Promise<ApiKey[]> {
    const entities = await this.repo.find({ order: { createdAt: 'DESC' } });
    return entities.map((e) => e.toDomain());
  }

  existsByHash(keyHash: string): Promise<boolean> {
    return this.repo.existsBy({ keyHash });
  }

  async create(fields: NewApiKey): Promise<ApiKey> {
    const entity = await this.repo.save(this.repo.create(fields));
    return entity.toDomain();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
