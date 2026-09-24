# Car Can Collector

<br/>
<div align="center">
<img src="./docs/logo.png" width="128">
    
<b>CAN 통신 기반 차량 운행 정보 수집기</b>
</div>


## 하드웨어 준비

### 부품

| 부품 | 용도 |
| --- | --- |
| ESP32 개발 보드 | 내장 TWAI(CAN) 컨트롤러로 프레임을 받고 Wi-Fi로 전송 |
| SN65HVD230 CAN 트랜시버 모듈 | ESP32의 3.3V 신호와 CAN 버스의 차동 신호를 서로 변환 |
| OBD2 커넥터(수) 또는 OBD2 분배 케이블 | 차량 CAN 버스에 연결 |
| 전원 | 차량용 USB 충전기, 또는 12V → 5V 강압 컨버터 |

### 배선

| ESP32 | SN65HVD230 | OBD2 핀 |
| --- | --- | --- |
| GPIO4 | CTX (TX) | |
| GPIO5 | CRX (RX) | |
| 3V3 | VCC | |
| GND | GND | 5번 (신호 접지) |
| | CANH | 6번 |
| | CANL | 14번 |

- CAN 통신 속도: 500kbps

### 펌웨어 업로드

1. Arduino IDE 보드 매니저에서 `esp32`(Espressif) 3.x를 설치하고 보드를 `ESP32 Dev Module`로 고릅니다.
2. 라이브러리 매니저에서 `WiFiManager`(tzapu)를 설치합니다.
3. `esp32/secrets.example.h`를 `esp32/secrets.h`로 복사한 뒤 값을 채웁니다.

   | 값 | 설명 |
   | --- | --- |
   | `SERVER_URL` | 수집 API 주소. `https://<서버 주소>/can-collector/collect` 형태 |
   | `DEVICE_ID` | 기기 식별자. 서버에 `X-Device-ID` 헤더로 전달됨 |
   | `API_TOKEN` | 서버 `.env`의 `API_KEY`와 같은 값 |


### 전송 방식

- 일부 CAN ID만 걸러서 보냅니다. 온도, 배터리 전압, TPMS, 주행거리처럼 천천히 바뀌는 신호는 60초에 한 번만 보냅니다.
- 10초가 지나거나 프레임이 500개 이상 쌓이면 한 번에 전송합니다.
- 데이터는 JSON이 아닌 바이너리로 보냅니다. 프레임 하나가 13바이트입니다.

## 서버 준비

### 요구 사항

- Node.js 24
- TimescaleDB 확장이 설치된 PostgreSQL

### 환경 변수

`.env.example`을 `.env`로 복사한 뒤 값을 채웁니다.

| 변수 | 설명 |
| --- | --- |
| `NODE_ENV` | `development`이면 SQL 로그를 출력하고 tRPC 오류 응답에 스택 트레이스를 포함합니다 |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL 접속 정보 |
| `API_KEY` | ESP32 인증 키. 펌웨어 `secrets.h`의 `API_TOKEN`과 같은 값이어야 합니다 |
| `PORT` | 선택. 서버 포트이며 기본값은 3000입니다 |

### 시작하기

```bash
pnpm install
pnpm run migration:run   # 테이블 생성
pnpm run start:dev       # 개발 모드(파일 변경 감지)
```


```bash
pnpm run build
pnpm run start:prod
```

### Docker

```bash
docker build -t car-can-collector .
docker run -d --env-file .env -p 3000:3000 car-can-collector
```

- 이미지는 마이그레이션을 실행하지 않습니다. 컨테이너를 띄우기 전에 `pnpm run migration:run`을 먼저 실행하세요.
- 컨테이너 안에서 `localhost`는 컨테이너 자신을 가리킵니다. `DB_HOST`에는 DB 서버의 실제 주소를 넣으세요.

### tRPC 타입 생성

```bash
pnpm run build:types
```
