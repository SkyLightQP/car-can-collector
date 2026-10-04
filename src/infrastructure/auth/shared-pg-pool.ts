import { Pool } from 'pg';
import type { DataSource } from 'typeorm';

export function sharedPgPool(dataSource: DataSource): Pool {
  const { master } = dataSource.driver as { master?: unknown };
  if (!(master instanceof Pool)) {
    throw new Error('Can not find TypeORM pg Pool. Check if DataSource is initialized with postgres');
  }
  return master;
}
