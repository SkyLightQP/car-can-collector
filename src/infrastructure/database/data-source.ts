import 'reflect-metadata';
import path from 'node:path';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { CanRawEntity } from '@infrastructure/database/entities/can-raw.entity';

config({ path: path.resolve(process.cwd(), '.env') });

const getEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export default new DataSource({
  type: 'postgres',
  host: getEnv('DB_HOST'),
  port: Number(getEnv('DB_PORT')),
  username: getEnv('DB_USERNAME'),
  password: getEnv('DB_PASSWORD'),
  database: getEnv('DB_NAME'),
  entities: [CanRawEntity],
  migrations: [path.join(process.cwd(), 'src/infrastructure/database/migrations/*{.ts,.js}')],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
