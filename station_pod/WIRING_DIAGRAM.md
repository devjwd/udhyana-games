# Station Pod — Electrical Wiring Diagram & Hardware Schematic

This document illustrates the complete physical wiring for the **Udhyana Games Station Pod**.

---

## 🎨 Master Visual Wiring Diagram

```
                              ┌─────────────────────────────┐
                              │     5V USB POWER INPUT      │
                              │  (From PS5/Xbox USB Port)   │
                              └──────────────┬──────────────┘
                                             │
                      ┌──────────────────────▼──────────────────────┐
                      │              ESP32 DEVKIT V1                │
                      │               (ESP-WROOM-32)                │
                      │                                             │
                      │   [3V3]   [GND]   [VIN]   [D21]   [D22]     │
                      │     │       │       │       │       │       │
                      │   [D4]    [D18]   [D19]     │       │       │
                      └─────┼───────┼───────┼───────┼───────┼───────┘
                            │       │       │       │       │
       ┌────────────────────┘       │       │       │       │
       │                            │       │       │       │
       ▼ (GPIO 4)                   │       │       │       │
┌──────────────────────────┐        │       │       │       │
│  WS2812B NeoPixel Ring   │        │       │       │       │
│  • DIN ───> GPIO 4       │        │       │       │       │
│  • 5V  ───> ESP32 VIN    │        │       │       │       │
│  • GND ───> ESP32 GND    │        │       │       │       │
└──────────────────────────┘        │       │       │       │
                                    │       │       │       │
       ┌────────────────────────────┘       │       │       │
       │                                    │       │       │
       ▼ (GPIO 18)                          │       │       │
┌──────────────────────────┐                │       │       │
│    5V Passive Buzzer     │                │       │       │
│  • Positive (+) ─> D18   │                │       │       │
│  • Negative (-) ─> GND   │                │       │       │
└──────────────────────────┘                │       │       │
                                            │       │       │
       ┌────────────────────────────────────┘       │       │
       │                                            │       │
       ▼ (GPIO 19)                                  │       │
┌──────────────────────────┐                        │       │
│   KY-005 IR Blaster      │                        │       │
│  • Signal ───> GPIO 19   │                        │       │
│  • 5V/VCC ───> VIN       │                        │       │
│  • GND    ───> GND       │                        │       │
└──────────────────────────┘                        │       │
                                                    │       │
       ┌────────────────────────────────────────────┴───────┘
       │
       ▼ (I2C: GPIO 21 & GPIO 22)
┌──────────────────────────┐
│   0.96" I2C OLED Screen  │
│   (SSD1306 128x64)       │
│  • SDA ─────> GPIO 21    │
│  • SCL ─────> GPIO 22    │
│  • VCC ─────> ESP32 3.3V │
│  • GND ─────> ESP32 GND  │
└──────────────────────────┘
```

---

## 📌 Pin-by-Pin Detailed Connection Table

| Module | Module Pin | ESP32 Pin | Wire Color Recommendation | Notes |
|---|---|---|---|---|
| **0.96" OLED Display** | `VCC` | `3.3V` | Red | Uses 3.3V logic to protect the SSD1306 controller |
| | `GND` | `GND` | Black | Common Ground |
| | `SCL` | `GPIO 22` | Yellow | I2C Clock |
| | `SDA` | `GPIO 21` | Green | I2C Data |
| **WS2812B NeoPixel Ring** | `5V / VCC` | `VIN` | Red | Direct 5V from USB port (clean power for LEDs) |
| | `GND` | `GND` | Black | Common Ground |
| | `DIN` | `GPIO 4` | Blue | Digital high-speed LED signal |
| **5V Passive Buzzer** | `Positive (+)` | `GPIO 18` | Orange | Driven by ESP32 PWM channel for tone melodies |
| | `Negative (-)` | `GND` | Black | Common Ground |
| **IR Transmitter (Blaster)**| `Signal (S)` | `GPIO 19` | White / Purple | Emits 38kHz modulated TV power pulses |
| | `VCC` | `VIN` (5V) | Red | Maximum IR blasting range |
| | `GND` | `GND` | Black | Common Ground |

---

## 💡 Assembly & Prototyping Notes

1. **Powering the Pod**:
   - The ESP32 VIN pin is connected directly to the USB cable power rail (+5V DC, 500mA - 1A).
   - The PS5 or Xbox rear USB port provides up to 1.5A, which is plenty of power to drive the ESP32, OLED, NeoPixels, and buzzer simultaneously.
2. **Current Consumption**:
   - ESP32 Wi-Fi active: ~120mA
   - OLED 128x64: ~20mA
   - 8-LED NeoPixel Ring (at 50% brightness): ~150mA
   - Buzzer during chime: ~25mA
   - Total max current: **~315mA** (Well below the USB safety limit of 500mA).
3. **IR LED Aiming**:
   - Position the IR Transmitter LED on the front face of the pod pointing toward the TV’s lower bezel where the TV’s IR sensor is located.
4. **Enclosure Advice**:
   - A standard 70mm x 50mm x 30mm plastic project box fits all components comfortably.
   - Use a milky white semi-transparent acrylic top cover: it diffuses the NeoPixel ring into a soft glow without glaring into the player's eyes!
