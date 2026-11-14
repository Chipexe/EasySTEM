import { ports, deviceTypes, validateDevices } from '../editor.board.js';
import { deviceBlockTypes } from './blocks.js';
import { createTelemetry,distanceHelper } from './telemetry.js';

const pin=value=>/^D\d+$/.test(value)?value.slice(1):value;
const indent=text=>text.split('\n').filter((line,i,lines)=>i<lines.length-1||line).map(line=>`  ${line}\n`).join('');
const active=block=>block.isEnabled()&&!block.getInheritedDisabled();

// Walk only the explicit Blockly types supported by the toolbox. No eval or raw code fields.
export function generateArduino(workspace,devices) {
 const errors=[], warnings=[], setup=new Map(), declarations=new Map(), helpers=new Map();
 const variables=new Map();let serial=false,sequence=0;
 const error=(block,message)=>{if(!errors.some(e=>e.blockId===block?.id&&e.message===message))errors.push({blockId:block?.id||null,message});};
 const configError=validateDevices(devices);if(configError)error(null,configError);
 function variable(block) {
  const id=block.getFieldValue('VAR');
  const model=workspace.getVariableMap().getVariableById(id);
  if(!model){error(block,'Biến không còn tồn tại.');return 'es_missing_variable';}
  if(!variables.has(id))variables.set(id,`es_var_${variables.size+1}`);
  return variables.get(id);
 }
 function device(block) {
  const d=devices.find(d=>d.id===block.getFieldValue('DEVICE'));
  if(!d||!deviceBlockTypes[block.type]?.includes(d.type)){error(block,'Chọn lại thiết bị đã khai báo cho khối này.');return null;}
  const p=ports[d.port];
  if(d.type==='led')setup.set(`led:${d.id}`,`pinMode(${pin(p.digital)}, OUTPUT);\ndigitalWrite(${pin(p.digital)}, LOW);`);
  else if(['pump','fan','motor'].includes(d.type))setup.set(`load:${d.id}`,`pinMode(${pin(p.in1)}, OUTPUT);\npinMode(${pin(p.in2)}, OUTPUT);\ndigitalWrite(${pin(p.in1)}, LOW);\ndigitalWrite(${pin(p.in2)}, LOW);`);
  else if(d.type==='servo') {
   const name=`es_servo_${d.port}`;declarations.set(name,`Servo ${name};`);setup.set(name,`${name}.attach(${p.signal});`);
  } else if(d.type==='ultrasonic')setup.set(`sonar:${d.id}`,`pinMode(${p.trig}, OUTPUT);\ndigitalWrite(${p.trig}, LOW);\npinMode(${p.echo}, INPUT);`);
  else if(block.type==='es_digital'||block.type==='es_button')setup.set(`input:${d.id}`,`pinMode(${pin(p.digital)}, ${d.type==='button'?'INPUT_PULLUP':'INPUT'});`);
  return {d,p};
 }
 function input(block,name,fallback='0') {
  const child=block.getInputTargetBlock(name);
  if(!child||!active(child)){const labels={TIME:'thời gian',ANGLE:'góc quay',VALUE:'giá trị',TIMES:'số lần lặp',BOOL:'điều kiện',FROM:'bắt đầu',TO:'kết thúc',BY:'bước tăng',DELTA:'lượng thay đổi'};error(block,`Chưa điền ${labels[name]||(name.startsWith('IF')?'điều kiện':'giá trị tính toán')}.`);return fallback;}
  return expression(child);
 }
 function option(block,name,options) {
  const value=block.getFieldValue(name);if(!Object.hasOwn(options,value)){error(block,`Giá trị ${name} không hợp lệ.`);return Object.values(options)[0];}return options[value];
 }
 function expression(b) {
  switch(b.type) {
   case 'math_number': {const value=Number(b.getFieldValue('NUM'));if(!Number.isFinite(value)||Math.abs(value)>1e12){error(b,'Số phải hữu hạn và nằm trong khoảng ±10¹².');return '0';}return String(value);}
   case 'text': return JSON.stringify(String(b.getFieldValue('TEXT')));
   case 'logic_boolean': return option(b,'BOOL',{TRUE:'true',FALSE:'false'});
   case 'variables_get': return variable(b);
   case 'es_millis': return '(double)millis()';
   case 'logic_compare': {
    const a=input(b,'A'),c=input(b,'B'),op=option(b,'OP',{EQ:'==',NEQ:'!=',LT:'<',LTE:'<=',GT:'>',GTE:'>='});
    const text=b.getInputTargetBlock('A')?.type==='text'||b.getInputTargetBlock('B')?.type==='text';
    return text?`(String(${a}) ${op} String(${c}))`:`(${a} ${op} ${c})`;
   }
   case 'logic_operation': return `(${input(b,'A','false')} ${option(b,'OP',{AND:'&&',OR:'||'})} ${input(b,'B','false')})`;
   case 'logic_negate': return `(!(${input(b,'BOOL','false')}))`;
   case 'math_arithmetic': {
    const a=input(b,'A'),c=input(b,'B');const op=b.getFieldValue('OP');
    if(op==='POWER')return `pow(${a}, ${c})`;
    return `((double)(${a}) ${option(b,'OP',{ADD:'+',MINUS:'-',MULTIPLY:'*',DIVIDE:'/'})} (${c}))`;
   }
   case 'math_modulo': return `fmod(${input(b,'DIVIDEND')}, ${input(b,'DIVISOR')})`;
   case 'math_random_int': {
    helpers.set('random',`long es_random(double a, double b) {\n  long low = (long)constrain(a, -1000000.0, 1000000.0);\n  long high = (long)constrain(b, -1000000.0, 1000000.0);\n  if (low > high) { long t = low; low = high; high = t; }\n  return random(low, high + 1);\n}`);
    return `es_random(${input(b,'FROM')}, ${input(b,'TO')})`;
   }
   case 'math_single': {
    const n=input(b,'NUM');const op=b.getFieldValue('OP');if(op==='NEG')return `(-(${n}))`;
    const fn=option(b,'OP',{ROOT:'sqrt',ABS:'fabs',LN:'log',LOG10:'log10',EXP:'exp',POW10:'pow'});
    return op==='POW10'?`pow(10, ${n})`:`${fn}(${n})`;
   }
   case 'es_analog': {const d=device(b);return d?`analogRead(${d.p.analog})`:'0';}
   case 'es_digital': {const d=device(b);return d?`digitalRead(${pin(d.p.digital)})`:'0';}
   case 'es_button': {const d=device(b);return d?`(digitalRead(${pin(d.p.digital)}) == LOW)`:'false';}
   case 'es_distance': {
    const d=device(b);
    helpers.set('distance',distanceHelper);
    return d?`es_distance_cm(${d.p.trig}, ${d.p.echo})`:'-1';
   }
   default:error(b,`Chưa hỗ trợ khối giá trị: ${b.type}.`);return '0';
  }
 }
 function chain(first,depth=0) {
  let result='';for(let b=first;b;b=b.getNextBlock()){if(active(b))result+=statement(b,depth);}return result;
 }
 function body(b,name,depth){return chain(b.getInputTargetBlock(name),depth);}
 function statement(b,loopDepth) {
  switch(b.type) {
   case 'es_led': {
    const d=device(b);if(!d)return '';
    const action=option(b,'ACTION',{ON:'HIGH',OFF:'LOW',TOGGLE:`!digitalRead(${pin(d.p.digital)})`});return `digitalWrite(${pin(d.p.digital)}, ${action});\n`;
   }
   case 'es_load':case 'es_motor': {
    const d=device(b);if(!d)return '';
    const mode=b.type==='es_load'?option(b,'ACTION',{ON:'FORWARD',OFF:'STOP'}):option(b,'DIRECTION',{FORWARD:'FORWARD',REVERSE:'REVERSE',STOP:'STOP'});
    const a=pin(d.p.in1),c=pin(d.p.in2);
    // Drop both inputs before changing direction; no analogWrite/PWM.
    return `digitalWrite(${a}, LOW);\ndigitalWrite(${c}, LOW);\n${mode==='FORWARD'?`digitalWrite(${a}, HIGH);\n`:mode==='REVERSE'?`digitalWrite(${c}, HIGH);\n`:''}`;
   }
   case 'es_servo': {const d=device(b),angle=input(b,'ANGLE');return d?`es_servo_${d.d.port}.write((int)constrain((double)(${angle}), 0.0, 180.0));\n`:'';}
   case 'es_wait': {
    const time=input(b,'TIME');const factor=option(b,'UNIT',{SECONDS:'1000.0',MILLISECONDS:'1.0'});
    return `es_wait_ms((double)(${time}) * ${factor});\n`;
   }
   case 'variables_set':return `${variable(b)} = ${input(b,'VALUE')};\n`;
   case 'math_change':return `${variable(b)} += ${input(b,'DELTA')};\n`;
   case 'es_serial_print':serial=true;return `Serial.println(${input(b,'VALUE')});\n`;
   case 'controls_if': {
    let code='',i=0;
    while(b.getInput(`IF${i}`)){code+=`${i?'else ':''}if (${input(b,`IF${i}`,'false')}) {\n${indent(body(b,`DO${i}`,loopDepth))}}\n`;i++;}
    if(b.getInput('ELSE'))code+=`else {\n${indent(body(b,'ELSE',loopDepth))}}\n`;return code;
   }
   case 'controls_repeat_ext': {
    const count=input(b,'TIMES'),id=++sequence;
    return `{\n  const long es_count_${id} = (long)constrain((double)(${count}), 0.0, 1000000.0);\n  for (long es_i_${id} = 0; es_i_${id} < es_count_${id}; ++es_i_${id}) {\n    es_pollSensors();\n${indent(indent(body(b,'DO',loopDepth+1)))}  }\n}\n`;
   }
   case 'controls_whileUntil': {
    const test=input(b,'BOOL','false'),mode=option(b,'MODE',{WHILE:'',UNTIL:'!'});
    return `while (${mode}(${test})) {\n  es_pollSensors();\n${indent(body(b,'DO',loopDepth+1))}}\n`;
   }
   case 'controls_for': {
    const name=variable(b),from=input(b,'FROM'),to=input(b,'TO'),by=input(b,'BY'),id=++sequence;
    return `{\n  const double es_end_${id} = ${to};\n  double es_step_${id} = fabs(${by});\n  if (es_step_${id} == 0) es_step_${id} = 1;\n  ${name} = ${from};\n  if (${name} > es_end_${id}) es_step_${id} = -es_step_${id};\n  for (; es_step_${id} > 0 ? ${name} <= es_end_${id} : ${name} >= es_end_${id}; ${name} += es_step_${id}) {\n    es_pollSensors();\n${indent(indent(body(b,'DO',loopDepth+1)))}  }\n}\n`;
   }
   case 'controls_flow_statements':if(!loopDepth){error(b,'Khối thoát/tiếp tục phải nằm trong vòng lặp.');return '';}return `${option(b,'FLOW',{BREAK:'break',CONTINUE:'continue'})};\n`;
   default:error(b,`Khối ${b.type} cần đặt đúng vị trí hoặc chưa được hỗ trợ.`);return '';
  }
 }
 const roots=workspace.getTopBlocks(true).filter(active);
 const starts=roots.filter(b=>b.type==='es_start'),loops=roots.filter(b=>b.type==='es_forever');
 if(starts.length>1)starts.forEach(b=>error(b,'Chỉ dùng một khối Khi bắt đầu.'));
 if(loops.length>1)loops.forEach(b=>error(b,'Chỉ dùng một khối Lặp liên tục.'));
 roots.filter(b=>!['es_start','es_forever'].includes(b.type)).forEach(b=>error(b,'Khối đang rời. Hãy ghép vào Khi bắt đầu hoặc Lặp liên tục.'));
 const setupCode=starts.map(b=>body(b,'DO',0)).join('');
 // The generated Arduino loop() is itself repeatedly called, but is not a C++ loop for break/continue.
 const loopCode=loops.map(b=>body(b,'DO',0)).join('');
 if(!roots.length)warnings.push({blockId:null,message:'Chưa có chương trình. Thêm khối Khi bắt đầu hoặc Lặp liên tục.'});
 const servoUsed=[...declarations.keys()].some(k=>k.startsWith('es_servo_'));
 const telemetry=createTelemetry(devices);
 if(telemetry.needsDistance)helpers.set('distance',distanceHelper);
 // Declared actuator outputs start LOW even when no Blockly action refers to them.
 const safeOutputs=devices.flatMap(d=>{const p=ports[d.port];if(!p)return [];return d.type==='led'?[`pinMode(${pin(p.digital)}, OUTPUT);`,`digitalWrite(${pin(p.digital)}, LOW);`]:['pump','fan','motor'].includes(d.type)?[p.in1,p.in2].flatMap(p=>[`pinMode(${pin(p)}, OUTPUT);`,`digitalWrite(${pin(p)}, LOW);`]):[];});
 const code=[
 '// EasySTEM — Arduino Nano / ATmega328P',
 '// Generated from Blockly. L298N uses digital outputs (no PWM).',
 '#include <Arduino.h>','#include <math.h>',...(servoUsed?['#include <Servo.h>']:[]),'',
 ...[...variables.values()].map(name=>`double ${name} = 0;`),...declarations.values(),'',
 ...helpers.values(),'',telemetry.poll,'',telemetry.wait,'',
 'void setup() {',indent([...safeOutputs,...telemetry.init,...setup.values(),...((serial||telemetry.enabled)?['Serial.begin(115200);']:[]),setupCode.trimEnd()].filter(Boolean).join('\n')).trimEnd(),'}','',
 'void loop() {',indent(`es_pollSensors();\n${loopCode}`).trimEnd(),'}',''
 ].join('\n').replace(/\n{3,}/g,'\n\n');
 return {code,errors,warnings};
}
