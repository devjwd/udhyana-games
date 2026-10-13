/*
 * Udhyana Games — Station Pod IR Remote Code Dumper
 * 
 * Hardware:
 * - ESP32 Dev Board
 * - VS1838B / KY-022 IR Receiver Module connected to GPIO 15
 * 
 * Instructions:
 * 1. Wire the IR Receiver: VCC -> 3.3V, GND -> GND, OUT/DATA -> GPIO 15
 * 2. Upload this sketch via Arduino IDE.
 * 3. Open Tools -> Serial Monitor at 115200 baud.
 * 4. Aim your TV remote at the receiver and press the POWER button.
 * 5. Copy the Protocol and Code shown into the station_pod.ino file!
 */

#include <Arduino.h>
#include <IRremoteESP8266.h>
#include <IRrecv.h>
#include <IRutils.h>

const uint16_t RECV_PIN = 15;
IRrecv irrecv(RECV_PIN);
decode_results results;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==========================================");
  Serial.println("  Udhyana Games — TV Remote IR Code Dumper");
  Serial.println("==========================================");
  Serial.println("Point your TV remote at the receiver and press POWER...\n");

  irrecv.enableIRIn(); // Start the receiver
}

void loop() {
  if (irrecv.decode(&results)) {
    Serial.println("------------------------------------------");
    Serial.print("Protocol  : ");
    Serial.println(typeToString(results.decode_type));
    
    Serial.print("Hex Code  : 0x");
    serialPrintUint64(results.value, HEX);
    Serial.println();

    Serial.print("Bit Length: ");
    Serial.println(results.bits);

    Serial.println("\nCopy this line to station_pod.ino:");
    Serial.printf("  sendIRCode(%s, 0x%llX, %d);\n", 
                  typeToString(results.decode_type).c_str(), 
                  (unsigned long long)results.value, 
                  results.bits);
    Serial.println("------------------------------------------\n");

    irrecv.resume(); // Receive the next value
  }
  delay(100);
}
