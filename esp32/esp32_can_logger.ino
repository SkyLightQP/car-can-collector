/**
 * ESP32 CAN Collector (단일 파일)
 *
 * 동작 흐름:
 *   CAN 수신 → ID 필터 → 느린신호 드롭 → 링버퍼 적재 → 배치 전송 (HTTPS / octet-stream)
 *
 * 적용된 최적화:
 *   1. ID 필터        : 관심 CAN ID만 통과 (-64%)
 *   2. 느린 신호 드롭 : 온도/배터리 등 30초에 1번만 전송 (-20%)
 *   3. 링버퍼         : 정적 배열, 힙 할당 없음
 *   4. 바이너리 전송  : JSON 없이 raw bytes (13B/frame vs JSON ~120B)
 *   5. ts 오프셋 압축 : 절대 ts(4B) → 배치 기준 오프셋(2B)
 *   6. 배치 플러시    : 10초 or 500프레임 조건
 *   7. WiFiManager    : SSID 하드코딩 제거, AP 포털로 설정
 *   8. WiFi 자동 복구 : 단절 시 재연결 후 버퍼 유지
 *
 * 페이로드 포맷 (헤더 없음, 메타데이터는 HTTP 헤더로 대체):
 *   [프레임 x N, 각 13B]
 *     ts_offset  uint16  2B  (배치 첫 프레임 ts 기준 ms 오프셋)
 *     can_id     uint16  2B
 *     dlc        uint8   1B
 *     data       uint8   8B  (미사용 바이트 0x00 패딩)
 *
 *   HTTP 헤더:
 *     X-Device-ID   : 기기 식별자
 *     X-Batch-Count : 프레임 수
 *     X-Base-Ts     : 배치 시작 ts (ms, millis() 기준)
 *     X-Api-Key     : 인증 토큰
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <driver/twai.h>
#include <string.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

#if __has_include("secrets.h")
#include "secrets.h"
#else
#error "Not found secrets.h"
#endif

// ═══════════════════════════════════════════════════════════
//  설정
// ═══════════════════════════════════════════════════════════

// ── WiFi ────────────────────────────────────────────────────
#define WIFI_AP_NAME            "ESP32-CAN-LOGGER"
#define WIFI_CHECK_INTERVAL_MS   5000

// ── WiFi 초기화 버튼 ─────────────────────────────────────────
// BOOT 버튼(GPIO0) 3초 누르면 저장된 WiFi 설정 초기화 후 AP 모드 재진입
#define WIFI_RESET_PIN          0
#define WIFI_RESET_HOLD_MS      3000

// ── CAN 핀 ──────────────────────────────────────────────────
#define CAN_TX_PIN   GPIO_NUM_4
#define CAN_RX_PIN   GPIO_NUM_5

// ── 서버 ────────────────────────────────────────────────────
#define HTTP_TIMEOUT_MS  6000

// ── 버퍼 / 플러시 조건 ──────────────────────────────────────
#define RING_BUFFER_SIZE   1024   // 반드시 2의 거듭제곱
#define FLUSH_INTERVAL_MS  10000  // 10초마다 플러시
#define FLUSH_MIN_FRAMES    500   // 500프레임 이상이면 즉시 플러시

// ── 페이로드 ────────────────────────────────────────────────
#define PAYLOAD_FRAME_SIZE  13    // ts_offset(2) + can_id(2) + dlc(1) + data(8)

// ═══════════════════════════════════════════════════════════
//  구조체
// ═══════════════════════════════════════════════════════════

typedef struct {
    uint32_t ts_ms;
    uint16_t can_id;
    uint8_t  dlc;
    uint8_t  data[8];
} CanFrame;

typedef struct {
    CanFrame buf[RING_BUFFER_SIZE];
    uint16_t head;
    uint16_t tail;
    uint16_t count;
} RingBuffer;

// ═══════════════════════════════════════════════════════════
//  CAN ID 필터
// ═══════════════════════════════════════════════════════════

static const uint16_t TARGET_IDS[] = {
    0x043,   // 에어컨
    0x044,   // 실내외온도
    0x07F,   // 램프 단선 상태
    0x500,   // 안전벨트
    0x50C,   // 연료 잔량 및 드라이브 모드
    0x593,   // 타이어 공기압 및 TPMS
    0x5B0,   // 주행거리
    0x316,   // EMS11      RPM, 차속, 토크
    0x329,   // EMS12      엔진(냉각수) 온도
    0x383,   // FATC11     외기 온도
    0x2B0,   // SAS11      조향각
    0x220,   // ESP12      횡/종 가속도, 요레이트
    0x386,   // WHL_SPD11  4륜 휠속도
    0x153,   // TCS11      ABS/TCS/ESP 상태
    0x4F1,   // CLU11      클러스터 차속
    0x545,   // EMS14      배터리 전압, MIL
    0x381,   // MDPS11     전동 조향 토크/각도
};
static const int TARGET_COUNT = sizeof(TARGET_IDS) / sizeof(TARGET_IDS[0]);

bool filter_is_target(uint32_t id) {
    for (int i = 0; i < TARGET_COUNT; i++)
        if (TARGET_IDS[i] == (uint16_t)id) return true;
    return false;
}

// ═══════════════════════════════════════════════════════════
//  느린 신호 드롭
//  변화가 느린 신호는 30초에 1번만 통과시켜 통신량 절감
//  대상: 온도, 배터리, TPMS, 주행거리, 램프상태, 안전벨트
// ═══════════════════════════════════════════════════════════

#define SLOW_INTERVAL_MS  60000  // 60초

static const uint16_t SLOW_IDS[] = {
    0x329,   // EMS12   엔진 온도     (수분 단위로 변화)
    0x383,   // FATC11  외기 온도     (수분 단위로 변화)
    0x545,   // EMS14   배터리 전압   (수십 초 단위)
    0x593,   // TPMS11  타이어 공기압 (거의 안 변함)
    0x5B0,   // CLU12   주행거리      (느리게 증가)
    0x07F,   // CGW5    램프 단선     (이벤트성)
    0x500,   // ACU14   안전벨트      (이벤트성)
};
static const int     SLOW_IDS_COUNT = sizeof(SLOW_IDS) / sizeof(SLOW_IDS[0]);
static uint32_t      s_slow_last_ms[sizeof(SLOW_IDS) / sizeof(SLOW_IDS[0])] = {0};

// 드롭해야 하면 true 반환
bool slow_should_drop(uint16_t can_id, uint32_t now) {
    for (int i = 0; i < SLOW_IDS_COUNT; i++) {
        if (SLOW_IDS[i] == can_id) {
            if (now - s_slow_last_ms[i] < SLOW_INTERVAL_MS) return true;
            s_slow_last_ms[i] = now;
            return false;
        }
    }
    return false;
}

// ═══════════════════════════════════════════════════════════
//  링버퍼
// ═══════════════════════════════════════════════════════════

RingBuffer g_ring;

void     rb_init()  { memset(&g_ring, 0, sizeof(g_ring)); }
uint16_t rb_count() { return g_ring.count; }
bool     rb_full()  { return g_ring.count >= RING_BUFFER_SIZE; }

bool rb_push(const CanFrame *f) {
    if (rb_full()) return false;
    g_ring.buf[g_ring.head] = *f;
    g_ring.head = (g_ring.head + 1) & (RING_BUFFER_SIZE - 1);
    g_ring.count++;
    return true;
}

uint16_t rb_pop(CanFrame *dst, uint16_t n) {
    uint16_t take = (n < g_ring.count) ? n : g_ring.count;
    for (uint16_t i = 0; i < take; i++) {
        dst[i] = g_ring.buf[g_ring.tail];
        g_ring.tail = (g_ring.tail + 1) & (RING_BUFFER_SIZE - 1);
    }
    g_ring.count -= take;
    return take;
}

// ═══════════════════════════════════════════════════════════
//  HTTP 전송
// ═══════════════════════════════════════════════════════════

static CanFrame s_pop_buf[RING_BUFFER_SIZE];
static uint8_t  s_payload[RING_BUFFER_SIZE * PAYLOAD_FRAME_SIZE];

static WiFiManager      g_wm;
static WiFiClientSecure g_tls;
static HTTPClient       g_http;
static uint32_t         g_send_ok   = 0;
static uint32_t         g_send_fail = 0;

void http_flush() {
    uint16_t n = rb_pop(s_pop_buf, RING_BUFFER_SIZE);
    if (n == 0) return;

    uint32_t base_ts = s_pop_buf[0].ts_ms;
    int      offset  = 0;

    for (uint16_t i = 0; i < n; i++) {
        CanFrame *f = &s_pop_buf[i];

        uint32_t diff   = f->ts_ms - base_ts;
        uint16_t ts_off = (diff > 0xFFFF) ? 0xFFFF : (uint16_t)diff;
        s_payload[offset++] = ts_off & 0xFF;
        s_payload[offset++] = (ts_off >> 8) & 0xFF;

        s_payload[offset++] = f->can_id & 0xFF;
        s_payload[offset++] = (f->can_id >> 8) & 0xFF;

        s_payload[offset++] = f->dlc;

        memcpy(s_payload + offset, f->data, 8);
        offset += 8;
    }

    g_http.begin(g_tls, SERVER_URL);
    g_http.addHeader("Content-Type",   "application/octet-stream");
    g_http.addHeader("Content-Length", String(offset));
    g_http.addHeader("X-Device-ID",    DEVICE_ID);
    g_http.addHeader("X-Batch-Count",  String(n));
    g_http.addHeader("X-Base-Ts",      String(base_ts));
    g_http.addHeader("X-Api-Key",      API_TOKEN);
    g_http.setTimeout(HTTP_TIMEOUT_MS);

    int code = g_http.POST(s_payload, offset);
    g_http.end();

    if (code == 401 || code == 403) {
        g_send_fail++;
        Serial.printf("[HTTP] AUTH ERR code=%d - API_TOKEN 확인 필요\n", code);
    } else if (code == 200 || code == 201 || code == 204) {
        g_send_ok++;
        Serial.printf("[HTTP] OK  frames=%d bytes=%d code=%d (ok=%lu fail=%lu)\n",
                      n, offset, code, g_send_ok, g_send_fail);
    } else {
        g_send_fail++;
        Serial.printf("[HTTP] ERR frames=%d code=%d (ok=%lu fail=%lu)\n",
                      n, code, g_send_ok, g_send_fail);
    }
}

// ═══════════════════════════════════════════════════════════
//  전역 상태
// ═══════════════════════════════════════════════════════════

static uint32_t g_last_flush_ms = 0;
static uint32_t g_last_wifi_ms  = 0;
static bool     g_wifi_ok       = false;

// ═══════════════════════════════════════════════════════════
//  setup / loop
// ═══════════════════════════════════════════════════════════

void setup() {
    // ⚠️ Brownout 감지 비활성화 (테스트용, 운영 시 외부 전원으로 교체 권장)
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

    Serial.begin(115200);
    Serial.println("[BOOT] CAN Collector starting...");

    rb_init();

    // TLS 인증서 검증 생략 (운영 시 setCACert 적용 권장)
    g_tls.setInsecure();

    // ── WiFi 초기화 버튼 감지 (부팅 후 3초) ────────────────
    pinMode(WIFI_RESET_PIN, INPUT_PULLUP);
    Serial.printf("[WiFi] WiFi 초기화하려면 BOOT 버튼 %d초 누르세요...\n",
                  WIFI_RESET_HOLD_MS / 1000);
    {
        uint32_t t = millis();
        while (millis() - t < WIFI_RESET_HOLD_MS) {
            if (digitalRead(WIFI_RESET_PIN) == LOW) {
                Serial.println("[WiFi] 설정 초기화 -> AP 모드 재진입");
                g_wm.resetSettings();
                break;
            }
            delay(50);
        }
    }

    // ── WiFiManager ──────────────────────────────────────────
    g_wm.setConnectTimeout(15);
    g_wm.setConfigPortalTimeout(120);
    if (!g_wm.autoConnect(WIFI_AP_NAME)) {
        Serial.println("[WiFi] 연결 실패, 재시작");
        ESP.restart();
    }
    g_wifi_ok = true;
    Serial.printf("[WiFi] Connected IP=%s\n", WiFi.localIP().toString().c_str());

    // ── CAN (TWAI) 초기화 ────────────────────────────────────
    twai_general_config_t g_config =
        TWAI_GENERAL_CONFIG_DEFAULT(CAN_TX_PIN, CAN_RX_PIN, TWAI_MODE_NORMAL);
    g_config.rx_queue_len = 100;
    twai_timing_config_t  t_config = TWAI_TIMING_CONFIG_500KBITS();
    twai_filter_config_t  f_config = TWAI_FILTER_CONFIG_ACCEPT_ALL();

    ESP_ERROR_CHECK(twai_driver_install(&g_config, &t_config, &f_config));
    ESP_ERROR_CHECK(twai_start());
    Serial.println("[CAN] TWAI started @ 500kbps, rx_queue=100");

    Serial.println("[BOOT] Ready.");
}

// ─────────────────────────────────────────────────────────
void loop() {
    uint32_t now = millis();

    // ── 1. WiFi 상태 체크 및 재연결 ─────────────────────────
    if (now - g_last_wifi_ms > WIFI_CHECK_INTERVAL_MS) {
        g_last_wifi_ms = now;
        if (WiFi.status() != WL_CONNECTED) {
            g_wifi_ok = false;
            Serial.println("[WiFi] Reconnecting...");
            WiFi.reconnect();
        } else {
            g_wifi_ok = true;
        }
    }

    // ── 2. CAN 수신 → ID 필터 → 느린신호 드롭 → 링버퍼 ─────
    twai_message_t msg;
    if (twai_receive(&msg, 0) == ESP_OK && !msg.rtr) {
        if (filter_is_target(msg.identifier)) {

            // 느린 신호는 30초에 1번만 통과
            if (!slow_should_drop((uint16_t)msg.identifier, now)) {

                CanFrame f;
                f.ts_ms  = now;
                f.can_id = (uint16_t)msg.identifier;
                f.dlc    = msg.data_length_code;
                memset(f.data, 0x00, 8);
                memcpy(f.data, msg.data, f.dlc);

                if (!rb_push(&f)) {
                    // 버퍼 풀 → 강제 플러시 후 재시도
                    Serial.println("[BUF] Full, forcing flush");
                    if (g_wifi_ok) { http_flush(); g_last_flush_ms = now; }
                    rb_push(&f);
                }
            }
        }
    }

    // ── 3. 조건 충족 시 배치 전송 ───────────────────────────
    bool time_ok  = (now - g_last_flush_ms) >= FLUSH_INTERVAL_MS;
    bool count_ok = rb_count() >= FLUSH_MIN_FRAMES;

    if ((time_ok || count_ok) && rb_count() > 0) {
        if (!g_wifi_ok) {
            Serial.println("[SEND] WiFi not ready, holding buffer");
        } else {
            http_flush();
            g_last_flush_ms = now;
        }
    }
}
