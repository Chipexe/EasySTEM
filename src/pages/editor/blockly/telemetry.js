import {ports,deviceTypes} from '../editor.board.js';
export const distanceHelper=`double es_distance_cm(uint8_t trig, uint8_t echo) {\n  digitalWrite(trig, LOW);\n  delayMicroseconds(2);\n  digitalWrite(trig, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(trig, LOW);\n  unsigned long duration = pulseIn(echo, HIGH, 30000UL);\n  if (duration == 0) return -1;\n  return duration / 58.0;\n}`;
const digital=value=>value.replace(/^D/,'');
export function createTelemetry(devices){
 const sensors=devices.filter(d=>deviceTypes[d.type]?.sensor&&ports[d.port]);const init=[],lines=[];let needsDistance=false;
 for(const d of sensors){
  const p=ports[d.port],t=deviceTypes[d.type];let read;
  if(d.type==='ultrasonic'){needsDistance=true;init.push(`pinMode(${p.trig}, OUTPUT);`,`digitalWrite(${p.trig}, LOW);`,`pinMode(${p.echo}, INPUT);`);read=`es_distance_cm(${p.trig}, ${p.echo})`;}
  else if(t.analog)read=`analogRead(${p.analog})`;
  else{init.push(`pinMode(${digital(p.digital)}, ${d.type==='button'?'INPUT_PULLUP':'INPUT'});`);read=d.type==='button'?`(digitalRead(${digital(p.digital)}) == LOW ? 1 : 0)`:`digitalRead(${digital(p.digital)})`;}
  const prefix=JSON.stringify({type:'sensor',id:d.id,port:d.port,unit:t.unit||'digital'}).slice(0,-1)+',"value":';
  lines.push(`  Serial.print(F(${JSON.stringify(prefix)}));`,`  Serial.print(${read});`,`  Serial.println(F("}"));`);
 }
 const poll=sensors.length?`void es_pollSensors() {\n  static unsigned long previous = 0;\n  unsigned long now = millis();\n  if (now - previous < 200UL) return;\n  previous = now;\n${lines.join('\n')}\n}`:'void es_pollSensors() {}';
 const wait=`void es_wait_ms(double duration) {\n  if (!isfinite(duration) || duration <= 0) return;\n  unsigned long waitTime = (unsigned long)constrain(duration, 0.0, 4294967040.0);\n  unsigned long started = millis();\n  while (millis() - started < waitTime) {\n    es_pollSensors();\n    delay(1);\n  }\n}`;
 return {init,poll,wait,needsDistance,enabled:!!sensors.length};
}
