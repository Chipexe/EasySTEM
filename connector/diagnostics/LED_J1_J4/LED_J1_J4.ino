#include <Arduino.h>

// EasySTEM Nano expansion: J1 = D10 + resistor, J4 = D11 + resistor.
// Diagnostic only: no pump, fan or sensor control.
bool ledOn = false;
unsigned long previous = 0;

void setup() {
  for (uint8_t pin = 6; pin <= 11; pin++) {
    digitalWrite(pin, LOW);
    pinMode(pin, OUTPUT);
  }
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
  Serial.begin(115200);
  Serial.println(F("EASYSTEM_LED_J1_J4_V1 READY"));
}

void loop() {
  unsigned long now = millis();
  if (now - previous < 1000UL) return;
  previous = now;
  ledOn = !ledOn;
  digitalWrite(10, ledOn ? HIGH : LOW);
  digitalWrite(11, ledOn ? HIGH : LOW);
  digitalWrite(LED_BUILTIN, ledOn ? HIGH : LOW);
  Serial.println(ledOn ? F("EASYSTEM_LED_J1_J4_V1 ON D10=1 D11=1")
                       : F("EASYSTEM_LED_J1_J4_V1 OFF D10=0 D11=0"));
}
