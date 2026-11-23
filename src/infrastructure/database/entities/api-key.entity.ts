import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiKey } from '@app/domain/api-key/api-key';

@Entity('api_key')
export class ApiKeyEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ type: 'text', name: 'name' })
  name: string;

  @Column({ type: 'text', name: 'key_hash' })
  keyHash: string;

  @Column({ type: 'text', name: 'key_prefix' })
  keyPrefix: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  toDomain(): ApiKey {
    return ApiKey.from({ id: this.id, name: this.name, prefix: this.keyPrefix, createdAt: this.createdAt });
  }
}
