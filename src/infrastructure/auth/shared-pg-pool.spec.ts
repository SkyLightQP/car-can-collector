import { Pool } from 'pg';
import type { DataSource } from 'typeorm';
import { sharedPgPool } from './shared-pg-pool';

function dataSourceWith(master: unknown): DataSource {
  return { driver: { master } } as unknown as DataSource;
}

describe('sharedPgPool', () => {
  it('TypeORM 이 연결해 둔 pg Pool 을 그대로 돌려준다', async () => {
    const pool = new Pool();

    expect(sharedPgPool(dataSourceWith(pool))).toBe(pool);

    await pool.end();
  });

  it('pg Pool 을 찾지 못하면 기동 시점에 바로 실패한다', () => {
    expect(() => sharedPgPool(dataSourceWith(undefined))).toThrow('TypeORM pg Pool');
  });
});
