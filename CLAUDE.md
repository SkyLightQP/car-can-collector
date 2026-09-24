# CLAUDE.md

## Project overview

NestJS backend that ingests raw CAN bus frames from an ESP32 device installed in a car, decodes
Hyundai/Kia CAN signals (per `hyundai_kia_generic.dbc`), and persists both the raw frames and the
decoded/aggregated records to a TimescaleDB (Postgres) hypertable. The frontend that consumes this
API is **car-can-dashboard**, a separate repository/project.

## Commands

```bash
# install deps (pnpm is required — see pnpm-lock.yaml / packageManager)
pnpm install

# run
pnpm run start          # once
pnpm run start:dev      # watch mode
pnpm run start:prod     # run compiled dist/main.js

# build
pnpm run build          # nest build -> dist/
pnpm run build:types    # tRPC AppRouter 타입 -> types/dist (car-can-dashboard 용, 커밋 대상)

# lint / format
pnpm run lint           # eslint --fix over src,apps,libs,test
pnpm run format         # prettier --write src/** test/**

# tests
pnpm run test                                   # unit tests (*.spec.ts under src/)
pnpm run test -- can-decode.service.spec         # run a single test file (jest pattern match)
pnpm run test -- -t "name of test"               # run tests matching a name
pnpm run test:watch
pnpm run test:cov
pnpm run test:e2e       # uses test/jest-e2e.json

# TypeORM migrations (against src/infrastructure/database/data-source.ts)
pnpm run migration:run
pnpm run migration:revert
pnpm run migration:show
```

Jest config lives inline in `package.json`: `rootDir` is `src`, tests must match `*.spec.ts`, and
path aliases `@app/*` / `@infrastructure/*` are mapped for `ts-jest`.

## Architecture

### Data flow

```
ESP32 (raw CAN frames, binary batch over HTTP)
  -> POST /can-collector/collect  (ApiKeyGuard: X-Api-Key header)
  -> CanCollectorService.collect()
       - parses the binary body into CanRaw frames
       - CanDecodeService.decode() turns frames into CanRecord aggregates
       - both CanRaw[] and CanRecord[] are persisted in parallel
```

The wire format (see `.llm/can_decoding_guide.md` for the full signal-by-signal DBC reference) is a
flat array of 13-byte frames with **no batch header** — batch metadata travels in HTTP headers
instead:

- `X-Device-ID`: device identifier
- `X-Base-Ts`: batch base timestamp (ms); each frame's `ts_offset` is added to this
- Body: `application/octet-stream`, raw-parsed via `body-parser` configured in `main.ts`

Each 13-byte frame is `ts_offset(u16 LE) + can_id(u16 LE) + dlc(u8) + data(8 bytes)`.

### Layering (`src/`)

- `app/controller` — HTTP surface. `CollectController` validates payload shape/headers and delegates
  to the service layer; guarded by `ApiKeyGuard` (compares `X-Api-Key` against `API_KEY` env var).
- `app/service` — business logic, framework-agnostic aside from DI decorators.
  - `CanCollectorService`: parses the binary batch into `CanRaw` domain objects and orchestrates
    saving raw + decoded data.
  - `CanDecodeService`: the CAN decoding engine (see below).
- `app/domain` — plain domain objects (`CanRaw`, `CanRecord`), constructed only via static `from()`
  factories, immutable (private fields via `#`).
- `infrastructure/database` — TypeORM entities, TypeORM config (`database.config.ts` for the app,
  standalone `data-source.ts` for the CLI/migrations), and migrations.
- `infrastructure/repository` — repositories that translate between domain objects and TypeORM
  entities (`fromDomain()` / `toDomain()` on each entity), using `orIgnore()` upserts since CAN
  frames/records can legitimately duplicate on the composite PK (`time`, `device_id`, [`can_id`]).

Path aliases: `@app/*` -> `src/app/*`, `@infrastructure/*` -> `src/infrastructure/*` (defined in
`tsconfig.json`, mirrored in the Jest `moduleNameMapper`).

### CAN decoding model (`CanDecodeService`)

This is the part most likely to need careful reasoning about correctness:

- CAN signals arrive at different rates (e.g. RPM/speed every batch, odometer/TPMS only every ~60s).
  `CanDecodeService` therefore keeps an **in-memory per-device state** (`Map<deviceId, DeviceState>`)
  that is updated incrementally as frames of different CAN IDs come in, rather than decoding each
  frame independently.
- On `onModuleInit`, it restores this in-memory state from the latest persisted `CanRecord` per
  device (`CanRecordRepository.findLatestPerDevice`), so a process restart doesn't zero out slow
  signals like odometer or drive mode.
- `decode(frames)` groups incoming frames by device, sorts by timestamp, applies each frame to that
  device's state via `applyFrame` (one CAN ID per case), and only emits a `CanRecord` if at least one
  *relevant* (mapped) CAN ID was seen in the batch — the record's timestamp is the latest frame
  timestamp in that batch.
- Signal extraction is little-endian bit-level: `extractLE(data, startBit, length)` pulls bits across
  byte boundaries, `toSigned` applies two's-complement for signed signals, and physical value =
  `raw * factor + offset`. Any new CAN ID/signal must follow this same decode pattern — the mapping
  from CAN ID to fields is in `applyFrame`, and the authoritative signal definitions (startBit,
  length, signed, factor, offset per CAN ID) are documented in `.llm/can_decoding_guide.md`.
- `engineOn` is a derived flag (`engineRpm > 0`) — there is no direct ignition signal in the captured
  CAN IDs.
- TPMS pressure bytes use `0xFF` as "sensor not received", decoded to `null` rather than `255`.

### Database

- Postgres with the TimescaleDB extension; `can_raw` and `can_record` are both hypertables
  (partitioned by `time`, see the `migrations/` for `create_hypertable` calls).
- `can_raw` PK is `(time, device_id, can_id)`; `can_record` PK is `(time, device_id)`.
- `synchronize` is always `false` — schema changes go through TypeORM migrations only.
- `data-source.ts` (used by the `migration:*` CLI scripts) loads `.env` directly via `dotenv` and is
  intentionally separate from `database.module.ts` (used by the running app via `ConfigService`).

### Dashboard query API (tRPC)

car-can-dashboard 는 `/trpc` 의 tRPC 조회 API(`vehicle.status`, `vehicle.batteryHistory`, `trips.daily`,
`trips.last`, `trips.weekly`)를 쓴다.

- `src/app/trpc/`: Zod 스키마(`schemas/`)와 라우터 팩토리(`routers/`). 라우터는 `VehicleQueries`/`TripQueries`
  인터페이스에만 의존하고, `VehicleQueryService`/`TripQueryService` 가 이를 구현한다. `TrpcModule` 이 appRouter 를
  `APP_ROUTER` 토큰으로 제공하고 `main.ts` 가 Express 어댑터로 `/trpc` 에 마운트한다(Nest 인터셉터/필터 미적용).
- 집계 SQL 은 `CanRecordRepository` 에 있다: KST(`Asia/Seoul`) 날짜/주(월요일) 버킷, 시동 ON(`engine_rpm > 0`) 레코드 간
  5분 초과 공백으로 세션 분할, 거리 = odometer MAX - MIN(0 제외), 주행 시간 = 5분 이하 간격의 합.
  `engine_on` 컬럼은 추가 마이그레이션 이전 행이 기본값 FALSE 로 남아 있어 집계에 쓰지 않는다.
- `src/app/trpc/index.ts` 에서 도달 가능한 파일은 상대 경로와 `zod`/`@trpc/server` 만 import 해야 한다.
  `pnpm run build:types` 가 여기서 `types/dist` 를 만들고, dashboard 는 `link:../car-can-collector/types` 로 참조한다.
  라우터/스키마를 바꾸면 `build:types` 를 다시 돌려 `types/dist` 를 함께 커밋한다.
- 인증 없음(`publicProcedure`). 로그인 도입 시 `trpc.context.ts` 의 `createContext` 에서 처리한다.

### Auth

Single shared-secret auth: `ApiKeyGuard` checks the `X-Api-Key` header against `API_KEY` from env.
Applied at the controller level (`@UseGuards(ApiKeyGuard)` on `CollectController`), not globally —
`HealthController`'s `/health` is unauthenticated. The `/trpc` dashboard API is currently unauthenticated as well.
