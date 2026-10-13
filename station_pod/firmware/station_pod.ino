/*
 * ============================================================================
 *  Udhyana Games — Wireless Station Pod Firmware
 *  Hardware: ESP32 Dev Module (WROOM-32)
 *  
 *  Peripherals:
 *  - 0.96" I2C OLED (SSD1306 128x64) on GPIO 21 (SDA) & GPIO 22 (SCL)
 *  - WS2812B NeoPixel RGB Ring (8 or 12 LEDs) on GPIO 4
 *  - 5V Passive Buzzer on GPIO 18 (PWM)
 *  - KY-005 / 940nm IR Transmitter on GPIO 19
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_NeoPixel.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>

// ========================
// CONFIGURATION SETTINGS
// ========================

// 1. Wi-Fi Settings
const char* WIFI_SSID     = "Udhyana_Lounge_WiFi";
const char* WIFI_PASSWORD = "YourLoungePassword";

// 2. Reception Server Settings
// IP of the computer running "npm run dev" or reception portal
const char* SERVER_HOST   = "192.168.1.50";
const int   SERVER_PORT   = 3000;

// 3. Station Identity (Must match hardware title / ID in reception catalog)
const char* STATION_ID    = "ps5-1";
const char* STATION_LABEL = "PS5 #1";

// 4. TV Remote IR Codes (Sample: Samsung TV Power Toggle)
// Use ir_remote_dumper.ino to find your exact TV code!
const uint16_t IR_SEND_PIN     = 19;
const uint64_t TV_POWER_HEX    = 0xE0E040BF; // Samsung Power code
const int      TV_BITS         = 32;

// ========================
// HARDWARE PIN DEFINITIONS
// ========================
#define SCREEN_WIDTH      128
#define SCREEN_HEIGHT     64
#define OLED_RESET        -1
#define OLED_ADDRESS      0x3C

#define NEOPIXEL_PIN      4
#define NUM_LEDS          8     // 8 or 12 LED ring

#define BUZZER_PIN        18
#define BUZZER_CHANNEL    0

// ========================
// GLOBAL OBJECTS & STATE
// ========================
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
Adafruit_NeoPixel strip(NUM_LEDS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
IRsend irsend(IR_SEND_PIN);

enum StationState {
  STATE_CONNECTING,
  STATE_IDLE,
  STATE_ACTIVE,
  STATE_WARNING,   // 5 minutes remaining
  STATE_EXPIRED,
  STATE_PAUSED
};

StationState currentState = STATE_CONNECTING;
StationState previousState = STATE_CONNECTING;

String playerName = "";
long remainingSeconds = 0;
unsigned long lastTickTime = 0;
unsigned long lastServerPoll = 0;
const unsigned long POLL_INTERVAL_MS = 3000; // Poll server every 3 seconds

int animationStep = 0;
bool warningChimed = false;
bool startChimed = false;

// ========================
// PASSIVE BUZZER SOUNDS
// ========================

// Play a single musical note with volume/duration
void playTone(int frequency, int durationMs) {
  if (frequency <= 0) {
    ledcWriteTone(BUZZER_PIN, 0);
    delay(durationMs);
    return;
  }
  ledcAttach(BUZZER_PIN, 2000, 8);
  ledcWriteTone(BUZZER_PIN, frequency);
  delay(durationMs);
  ledcWriteTone(BUZZER_PIN, 0);
}

// Gentle pleasant startup chime (Ding-Dong!)
void playSessionStartChime() {
  playTone(523, 100); // C5
  delay(30);
  playTone(659, 100); // E5
  delay(30);
  playTone(784, 200); // G5
}

// Subtle near-field warning chime for 5 mins left
void playWarningChime() {
  playTone(880, 80);  // A5
  delay(60);
  playTone(880, 80);  // A5
}

// Rhythmic alert pulse synchronized with red light
void playExpiryPulse() {
  playTone(659, 120); // E5
  delay(80);
  playTone(523, 160); // C5
}

// ========================
// NEOPIXEL ANIMATIONS
// ========================

void setAllPixels(uint8_t r, uint8_t g, uint8_t b) {
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

void renderNeoPixelAnimation() {
  animationStep++;

  switch (currentState) {
    case STATE_CONNECTING: {
      // Spinning blue dot
      strip.clear();
      int led = (animationStep / 2) % NUM_LEDS;
      strip.setPixelColor(led, strip.Color(0, 100, 255));
      strip.show();
      break;
    }

    case STATE_IDLE: {
      // Gentle breathing calm cyan/blue
      int brightness = 15 + (sin(animationStep * 0.08) * 12);
      setAllPixels(0, brightness / 2, brightness);
      break;
    }

    case STATE_ACTIVE: {
      // Solid gamer green
      setAllPixels(0, 80, 20);
      break;
    }

    case STATE_WARNING: {
      // Pulsing warm amber/yellow
      int brightness = 50 + (sin(animationStep * 0.25) * 40);
      setAllPixels(brightness, brightness * 0.7, 0);
      break;
    }

    case STATE_EXPIRED: {
      // Strobe flashing red in sync with beep
      bool flashOn = (animationStep % 6) < 3;
      if (flashOn) {
        setAllPixels(180, 0, 0);
      } else {
        setAllPixels(15, 0, 0);
      }
      break;
    }

    case STATE_PAUSED: {
      // Breathing orange
      int brightness = 30 + (sin(animationStep * 0.1) * 20);
      setAllPixels(brightness, brightness * 0.4, 0);
      break;
    }
  }
}

// ========================
// OLED DISPLAY RENDERING
// ========================

String formatTime(long totalSecs) {
  if (totalSecs < 0) totalSecs = 0;
  long h = totalSecs / 3600;
  long m = (totalSecs % 3600) / 60;
  long s = totalSecs % 60;

  char buf[16];
  if (h > 0) {
    snprintf(buf, sizeof(buf), "%02ld:%02ld:%02ld", h, m, s);
  } else {
    snprintf(buf, sizeof(buf), "%02ld:%02ld", m, s);
  }
  return String(buf);
}

void updateOledDisplay() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // 1. Header Bar
  display.setTextSize(1);
  display.setCursor(0, 2);
  display.print(STATION_LABEL);

  display.setCursor(84, 2);
  if (WiFi.status() == WL_CONNECTED) {
    display.print("WiFi OK");
  } else {
    display.print("NO NET");
  }

  display.drawLine(0, 12, 128, 12, SSD1306_WHITE);

  // 2. Main Body Content
  switch (currentState) {
    case STATE_CONNECTING:
      display.setTextSize(1);
      display.setCursor(16, 26);
      display.print("Connecting WiFi...");
      display.setCursor(16, 42);
      display.print(WIFI_SSID);
      break;

    case STATE_IDLE:
      display.setTextSize(1);
      display.setCursor(18, 22);
      display.print("READY TO PLAY");
      display.setTextSize(1);
      display.setCursor(4, 42);
      display.print("Visit desk to start");
      break;

    case STATE_ACTIVE:
      display.setTextSize(2);
      display.setCursor(16, 20);
      display.print(formatTime(remainingSeconds));

      display.setTextSize(1);
      display.setCursor(0, 48);
      display.print("Player: ");
      display.print(playerName.substring(0, 12));
      break;

    case STATE_WARNING:
      display.setTextSize(2);
      display.setCursor(16, 18);
      display.print(formatTime(remainingSeconds));

      display.setTextSize(1);
      display.setCursor(12, 44);
      display.print("! 5 MINS REMAINING !");
      display.setCursor(14, 55);
      display.print("Save your game now");
      break;

    case STATE_EXPIRED:
      display.setTextSize(2);
      display.setCursor(14, 18);
      display.print("TIME'S UP");

      display.setTextSize(1);
      display.setCursor(2, 42);
      display.print("Session has ended.");
      display.setCursor(2, 54);
      display.print("Please check out desk");
      break;

    case STATE_PAUSED:
      display.setTextSize(2);
      display.setCursor(26, 20);
      display.print("PAUSED");

      display.setTextSize(1);
      display.setCursor(14, 48);
      display.print("Timer is frozen");
      break;
  }

  display.display();
}

// ========================
// IR TV REMOTE SENDER
// ========================

void triggerTvPowerToggle() {
  Serial.println("[IR] Blasting TV Power command...");
  irsend.sendSAMSUNG(TV_POWER_HEX, TV_BITS);
  // Example for NEC Protocol TV:
  // irsend.sendNEC(0x20DF10EF, 32);
}

// ========================
// HTTP RECEPTION SERVER POLL
// ========================

void pollReceptionServer() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String("http://") + SERVER_HOST + ":" + SERVER_PORT + "/api/station-pod?stationId=" + STATION_ID;
  http.begin(url);
  http.setTimeout(2000);

  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      String statusStr = doc["status"].as<String>();
      playerName = doc["guestName"].as<String>();
      long serverRemainingSec = doc["remainingSeconds"].as<long>();
      String command = doc["command"].as<String>();

      // Check remote commands from reception (e.g. Turn off TV)
      if (command == "TV_POWER_OFF" || command == "TV_POWER_ON") {
        triggerTvPowerToggle();
      }

      // Update local state
      remainingSeconds = serverRemainingSec;

      if (statusStr == "IDLE") {
        currentState = STATE_IDLE;
        warningChimed = false;
        startChimed = false;
      } else if (statusStr == "PAUSED") {
        currentState = STATE_PAUSED;
      } else if (statusStr == "EXPIRED" || (statusStr == "ACTIVE" && remainingSeconds <= 0)) {
        currentState = STATE_EXPIRED;
      } else if (statusStr == "ACTIVE") {
        if (remainingSeconds <= 300) {
          currentState = STATE_WARNING;
          if (!warningChimed) {
            playWarningChime();
            warningChimed = true;
          }
        } else {
          currentState = STATE_ACTIVE;
          if (!startChimed) {
            playSessionStartChime();
            startChimed = true;
          }
        }
      }
    }
  }
  http.end();
}

// ========================
// SETUP & MAIN LOOP
// ========================

void setup() {
  Serial.begin(115200);
  delay(300);

  // Initialize Hardware
  irsend.begin();
  strip.begin();
  strip.setBrightness(120);
  strip.show();

  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println("[OLED] Failed to initialize SSD1306");
  }
  display.clearDisplay();
  display.display();

  // Connect to Wi-Fi
  currentState = STATE_CONNECTING;
  updateOledDisplay();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    renderNeoPixelAnimation();
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] Connection failed. Running in standalone clock mode.");
  }

  currentState = STATE_IDLE;
}

void loop() {
  unsigned long now = millis();

  // 1. Local Hardware Clock (Ticks down every 1 second accurately)
  if (now - lastTickTime >= 1000) {
    lastTickTime = now;
    if (currentState == STATE_ACTIVE || currentState == STATE_WARNING) {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        if (remainingSeconds <= 300 && currentState == STATE_ACTIVE) {
          currentState = STATE_WARNING;
          if (!warningChimed) {
            playWarningChime();
            warningChimed = true;
          }
        }
      } else {
        currentState = STATE_EXPIRED;
        playExpiryPulse();
      }
    } else if (currentState == STATE_EXPIRED) {
      // Repeat a polite alert pulse every 8 seconds
      static int expiredBeepCounter = 0;
      if (++expiredBeepCounter % 8 == 0) {
        playExpiryPulse();
      }
    }
    updateOledDisplay();
  }

  // 2. Poll the Reception Server every POLL_INTERVAL_MS
  if (now - lastServerPoll >= POLL_INTERVAL_MS) {
    lastServerPoll = now;
    pollReceptionServer();
  }

  // 3. Smooth LED Animation (Runs at ~30 FPS)
  renderNeoPixelAnimation();
  delay(33);
}
