# Udhyana Games — Wireless Station Pod 🎮📡

The **Station Pod** is an automated, wireless IoT device placed at each gaming console station (PS5, Xbox, PC) in the lounge. It alerts the player when their session is ending or expired with polite sound chimes, RGB illumination, a mini countdown OLED screen, and an IR transmitter to remotely control the station's TV power.

---

## 📋 System Architecture

```
                                  Lounge Wi-Fi
                                       │
     ┌─────────────────────────────────┴────────────────────────────────┐
     │                                                                  │
     ▼                                                                  ▼
┌──────────────────────────────┐                       ┌──────────────────────────────┐
│  Udhyana Reception Server    │                       │   Station Pod (e.g. PS5-1)   │
│  Next.js @ :3000             │                       │   ESP32 Microcontroller      │
│                              │                       │                              │
│  • Session Timer State       │◄────── HTTP / SSE ───►│  • 0.96" I2C OLED Screen     │
│  • Automated Cutoffs         │    Poll (every 3s)    │  • WS2812B NeoPixel Ring     │
│  • /api/station-pod Endpoint │                       │  • 5V Passive Buzzer         │
│  • TV Power Controls         │                       │  • 940nm IR Transmitter LED  │
└──────────────────────────────┘                       └──────────────────────────────┘
```

---

## ⚙️ Automated Pod States

| State | OLED Screen | NeoPixel RGB Ring | Passive Buzzer | TV Action |
|---|---|---|---|---|
| **IDLE / AVAILABLE** | `"READY TO PLAY"` + Station Name | Soft breathing Blue | Silent | TV On / Standby |
| **ACTIVE SESSION** | `"01:14:32"` + Player Name | Solid Calm Green | Gentle start chime (`Ding!`) | TV Screen Active |
| **5 MIN WARNING** | `"00:04:59 - 5 MINS LEFT!"` | Pulsing Amber/Yellow | Soft double-chirp (`bloop-bloop`) | None (Player warned) |
| **EXPIRED** | `"TIME'S UP! VISIT RECEPTION"` | Strobe Blinking Red | Sync melody with LED flash | Auto-shutoff after grace period |
| **PAUSED** | `"SESSION PAUSED"` | Breathing Orange | Single chirp | None |

---

## 🛒 Hardware Bill of Materials (Per Pod)

| Component | Specification | Pin / Interface | Approx Price (PKR) |
|---|---|---|---|
| **Brain** | ESP32 Dev Board (ESP-WROOM-32, 30/38 pin, Type-C or Micro-USB) | — | ₨ 1,300 – 1,600 |
| **Display** | 0.96" I2C OLED Display (SSD1306, 128x64, 4-pin) | SDA (D21), SCL (D22) | ₨ 550 – 750 |
| **Light Ring** | WS2812B NeoPixel RGB Ring (8 or 12 LEDs, 5V) | DIN (D4) | ₨ 450 – 600 |
| **Chime** | 5V Passive Buzzer Module (Piezoelectric) | SIG (D18) | ₨ 60 – 100 |
| **IR Blaster** | 940nm IR Transmitter Module (e.g., KY-005) | SIG (D19) | ₨ 80 – 150 |
| **Power** | 1.5m USB Cable (USB-A to Type-C/Micro-USB) plugged into console | VIN & GND | ₨ 150 – 250 |
| **Shared Tool** | 1x VS1838B IR Receiver Module (To clone TV remote once) | Recv (D15) | ₨ 60 – 90 |

---

## 🔌 Pinout Connection Chart

```
ESP32 GPIO Pin    │ Connected Component & Pin
──────────────────┼──────────────────────────────────────
3.3V              │ OLED VCC
VIN (5V USB)      │ NeoPixel VCC (+5V), Buzzer VCC (if 3-pin module)
GND               │ OLED GND, NeoPixel GND, Buzzer GND, IR LED GND
GPIO 21 (SDA)     │ OLED SDA (Data)
GPIO 22 (SCL)     │ OLED SCL (Clock)
GPIO 4            │ NeoPixel DIN (Data In)
GPIO 18           │ Passive Buzzer Positive / Signal Pin
GPIO 19           │ IR Transmitter Signal Pin (via 220Ω resistor or module)
```

---

## 📂 Folder Structure

```
station_pod/
├── README.md                  <- This comprehensive overview
├── WIRING_DIAGRAM.md          <- Visual ASCII circuit schematic & pinout
└── firmware/
    ├── station_pod.ino        <- Main ESP32 production firmware
    └── ir_remote_dumper.ino   <- Helper sketch to learn your TV remote's IR codes
```

---

## 🚀 Quick Start Guide

### Step 1: Clone Your Lounge TV Remote Code (One-time)
1. Open `firmware/ir_remote_dumper.ino` in Arduino IDE.
2. Connect the **VS1838B IR Receiver** to pin `D15`.
3. Open Serial Monitor at **115200 baud**.
4. Point your TV remote at the sensor and press the **Power** button.
5. Note down the protocol and Hex code (e.g. `SAMSUNG: 0xE0E040BF` or `NEC: 0x20DF10EF`).

### Step 2: Flash the Pod Firmware
1. Install the required Arduino libraries:
   - `Adafruit GFX Library`
   - `Adafruit SSD1306`
   - `Adafruit NeoPixel`
   - `ArduinoJson` (v6 or v7)
   - `IRremoteESP8266`
2. Open `firmware/station_pod.ino`.
3. Set your Wi-Fi credentials:
   ```cpp
   const char* WIFI_SSID = "Udhyana_Lounge_5G";
   const char* WIFI_PASS = "YourLoungeWifiPassword";
   const char* SERVER_HOST = "192.168.1.50"; // IP of the reception computer
   const int   SERVER_PORT = 3000;
   const char* STATION_ID  = "ps5-1";        // Must match consoleId in catalog
   ```
4. Put your TV remote Hex code into the IR section.
5. Click **Upload**!

### Step 3: Power Up & Play
- Plug the USB cable into the console's rear USB port.
- The pod will show the Wi-Fi connecting animation, then enter `READY TO PLAY`.
- As soon as reception starts a session for that station, the pod automatically transitions to **Green**, starts the countdown timer, and warns the player before expiry!
