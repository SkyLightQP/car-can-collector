import { cpSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('types/dist');
const target = resolve(process.env.DASHBOARD_TYPES_DIR ?? '../car-can-dashboard/app/types/collector');

if (!existsSync(source)) {
  console.error(`${source} 가 없습니다. pnpm run build:types 를 먼저 실행하세요.`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log(`tRPC 타입을 ${target} 로 복사했습니다.`);
