import test from 'node:test';
import assert from 'node:assert/strict';
import Blockly from 'blockly/core';
import 'blockly/blocks';
import * as vi from 'blockly/msg/vi';
import {registerBlocks,refreshDeviceFields} from '../src/pages/editor/blockly/blocks.js';
import {initialWorkspace,toolbox} from '../src/pages/editor/blockly/toolbox.js';
import {generateArduino} from '../src/pages/editor/blockly/arduino-generator.js';
import {initialDevices} from '../src/pages/editor/editor.board.js';
import {validateProject} from '../src/pages/editor/blockly/project.js';
Blockly.setLocale(vi);registerBlocks(Blockly);
const copy=value=>JSON.parse(JSON.stringify(value));
const num=n=>({shadow:{type:'math_number',fields:{NUM:n}}});
const chain=(...items)=>items.reduceRight((next,item)=>({...item,...(next?{next:{block:next}}:{})}),null);
function state(...items){return {blocks:{languageVersion:0,blocks:[{type:'es_forever',inputs:{DO:{block:chain(...items)}}}]}};}
function workspace(data=initialWorkspace,devices=initialDevices){const w=new Blockly.Workspace();w.stemDevices=devices;Blockly.Events.disable();try{Blockly.serialization.workspaces.load(data,w);}finally{Blockly.Events.enable();}return w;}
function generate(data,devices=initialDevices){const w=workspace(data,devices);try{return generateArduino(w,devices);}finally{w.dispose();}}
function project(data=initialWorkspace,devices=initialDevices){return {version:3,board:'nano-expansion-v1',name:'Dự án kiểm tra',devices,workspace:data,view:{scale:.85}};}

test('LED follows declared J1/D10 and remapping to J4/D11 without changing blocks',()=>{
 const first=generate(initialWorkspace);assert.deepEqual(first.errors,[]);assert.match(first.code,/pinMode\(10, OUTPUT\)/);assert.match(first.code,/digitalWrite\(10, HIGH\)/);assert.match(first.code,/void setup\(\)/);assert.match(first.code,/void loop\(\)/);
 const devices=copy(initialDevices);devices.find(d=>d.id==='led').port='J4';const changed=generate(initialWorkspace,devices);assert.deepEqual(changed.errors,[]);assert.match(changed.code,/digitalWrite\(11, HIGH\)/);assert.doesNotMatch(changed.code,/digitalWrite\(10,/);
});
test('distance uses J14 TRIG A0/ECHO A1, timeout and no-echo result',()=>{
 const result=generate(state({type:'es_serial_print',inputs:{VALUE:{block:{type:'es_distance',fields:{DEVICE:'ultrasonic'}}}}}));assert.deepEqual(result.errors,[]);assert.match(result.code,/es_distance_cm\(A0, A1\)/);assert.match(result.code,/pulseIn\(echo, HIGH, 30000UL\)/);assert.match(result.code,/return -1/);assert.match(result.code,/Serial.begin\(115200\)/);
});
test('L298N pump and fan use both channels with digital control and no PWM',()=>{
 const result=generate(state({type:'es_load',fields:{DEVICE:'pump',ACTION:'ON'}},{type:'es_load',fields:{DEVICE:'fan',ACTION:'OFF'}}));assert.deepEqual(result.errors,[]);for(const pin of [6,7,8,9])assert.match(result.code,new RegExp(`pinMode\\(${pin}, OUTPUT\\)`));assert.match(result.code,/digitalWrite\(6, HIGH\)/);assert.doesNotMatch(result.code,/analogWrite\(/);
});
test('motor reverse and stop do not leave opposite input high',()=>{
 const devices=[{id:'motor',type:'motor',port:'J15-B'}];const result=generate(state({type:'es_motor',fields:{DEVICE:'motor',DIRECTION:'REVERSE'}}),devices);assert.deepEqual(result.errors,[]);assert.match(result.code,/digitalWrite\(8, LOW\);\n  digitalWrite\(9, LOW\);\n  digitalWrite\(9, HIGH\)/);
});
test('servo includes library, attach A4 and limits angles',()=>{
 const result=generate(state({type:'es_servo',fields:{DEVICE:'servo'},inputs:{ANGLE:num(200)}}),[{id:'servo',type:'servo',port:'J12'}]);assert.deepEqual(result.errors,[]);assert.match(result.code,/#include <Servo.h>/);assert.match(result.code,/es_servo_J12.attach\(A4\)/);assert.match(result.code,/180\.0/);
});
test('raw analog and digital read distinct J8 signal pins',()=>{
 const result=generate(state({type:'es_serial_print',inputs:{VALUE:{block:{type:'es_analog',fields:{DEVICE:'soil'}}}}},{type:'es_serial_print',inputs:{VALUE:{block:{type:'es_digital',fields:{DEVICE:'soil'}}}}}));assert.deepEqual(result.errors,[]);assert.match(result.code,/analogRead\(A7\)/);assert.match(result.code,/digitalRead\(2\)/);assert.doesNotMatch(result.code,/map\(/);
});
test('button uses pull-up and active-low comparison',()=>{
 const result=generate(state({type:'es_serial_print',inputs:{VALUE:{block:{type:'es_button',fields:{DEVICE:'button'}}}}}),[{id:'button',type:'button',port:'J10'}]);assert.deepEqual(result.errors,[]);assert.match(result.code,/pinMode\(4, INPUT_PULLUP\)/);assert.match(result.code,/digitalRead\(4\) == LOW/);
});
test('deleted device remains selected as missing and blocks generation',()=>{
 const w=workspace();try{const devices=initialDevices.filter(d=>d.id!=='led');refreshDeviceFields(Blockly,w,devices);const b=w.getAllBlocks(false).find(b=>b.type==='es_led');assert.equal(b.getFieldValue('DEVICE'),'led');const result=generateArduino(w,devices);assert.ok(result.errors.some(e=>e.blockId===b.id));assert.doesNotMatch(result.code,/digitalWrite\(10,/);}finally{w.dispose();}
});
test('changing device type invalidates incompatible linked blocks',()=>{
 const devices=[...initialDevices.map(d=>d.id==='led'?{id:'led',type:'servo',port:'J12'}:d),{id:'other-led',type:'led',port:'J4'}];const w=workspace(initialWorkspace,devices);try{assert.ok(w.getAllBlocks(false).filter(b=>b.type==='es_led').every(b=>b.getFieldValue('DEVICE')==='led'));assert.ok(generateArduino(w,devices).errors.length>0);}finally{w.dispose();}
});
test('missing value, detached block and break outside loop are errors',()=>{
 assert.ok(generate(state({type:'es_wait'})).errors.some(e=>/thời gian/.test(e.message)));
 assert.ok(generate({blocks:{blocks:[{type:'es_led',fields:{DEVICE:'led',ACTION:'ON'}}]}}).errors.some(e=>/rời/.test(e.message)));
 assert.ok(generate(state({type:'controls_flow_statements',fields:{FLOW:'BREAK'}})).errors.some(e=>/vòng lặp/.test(e.message)));
});
test('if/else and sensor comparisons generate nested C++ branches',()=>{
 const result=generate(state({type:'controls_if',extraState:{hasElse:true},inputs:{IF0:{block:{type:'logic_compare',fields:{OP:'LT'},inputs:{A:{block:{type:'es_analog',fields:{DEVICE:'soil'}}},B:num(600)}}},DO0:{block:{type:'es_load',fields:{DEVICE:'pump',ACTION:'ON'}}},ELSE:{block:{type:'es_load',fields:{DEVICE:'pump',ACTION:'OFF'}}}}}));assert.deepEqual(result.errors,[]);assert.match(result.code,/if \(\(analogRead\(A7\) < 600\)\)/);assert.match(result.code,/else \{/);
});
test('variables, for, repeats and flow blocks generate declared numeric variables',()=>{
 const data=state({type:'variables_set',fields:{VAR:{id:'v1'}},inputs:{VALUE:num(2)}},{type:'controls_for',fields:{VAR:{id:'v1'}},inputs:{FROM:num(1),TO:num(3),BY:num(1),DO:{block:{type:'controls_flow_statements',fields:{FLOW:'CONTINUE'}}}}},{type:'controls_repeat_ext',inputs:{TIMES:num(3),DO:{block:{type:'math_change',fields:{VAR:{id:'v1'}},inputs:{DELTA:num(2)}}}}});data.variables=[{id:'v1',name:'nhiệt độ; #include',type:''}];const result=generate(data);assert.deepEqual(result.errors,[]);assert.match(result.code,/double es_var_1 = 0;/);assert.match(result.code,/continue;/);assert.match(result.code,/es_var_1 \+= 2;/);assert.doesNotMatch(result.code,/nhiệt độ/);
});
test('JSON roundtrip preserves block IDs, coordinates, fields and generated code',()=>{
 const w=workspace();try{const before=generateArduino(w,initialDevices);const saved=Blockly.serialization.workspaces.save(w);const root=saved.blocks.blocks.find(b=>b.type==='es_forever');assert.equal(root.id,'forever-root');assert.equal(root.x,35);const next=workspace(saved);try{assert.equal(generateArduino(next,initialDevices).code,before.code);assert.equal(next.getAllBlocks(false).length,w.getAllBlocks(false).length);}finally{next.dispose();}}finally{w.dispose();}
});
test('project validation rejects unknown blocks, collisions, excessive mutations and wrong versions',()=>{
 assert.equal(validateProject(project()),'');
 assert.ok(validateProject({...project(),version:2}));
 assert.ok(validateProject(project({blocks:{blocks:[{type:'raw_cpp'}]}})));
 assert.ok(validateProject(project(initialWorkspace,[...initialDevices,{id:'collision',type:'led',port:'J1'}])));
 assert.ok(validateProject(project(state({type:'controls_if',extraState:{elseIfCount:1000000}}))));
});
test('all toolbox blocks instantiate and are covered by project validation',()=>{
 const w=new Blockly.Workspace();w.stemDevices=initialDevices;
 try{for(const category of toolbox.contents){for(const item of category.contents||[]){const b=w.newBlock(item.type);assert.ok(b);b.dispose();}}assert.equal(validateProject(project(Blockly.serialization.workspaces.save(w))),'');}finally{w.dispose();}
});
test('numeric variable assignments reject text connections',()=>{
 const w=workspace({});try{const set=w.newBlock('variables_set'),text=w.newBlock('text');assert.equal(w.connectionChecker.canConnect(set.getInput('VALUE').connection,text.outputConnection,false),false);}finally{w.dispose();}
});
test('generated firmware polls declared sensors during waits and protects raw LED ports',()=>{
 const result=generate(initialWorkspace);assert.match(result.code,/void es_pollSensors\(\)/);assert.match(result.code,/void es_wait_ms\(double duration\)/);assert.match(result.code,/Serial.begin\(115200\)/);assert.match(result.code,/analogRead\(A7\)/);assert.ok(result.code.includes('\\"id\\":\\"soil\\"'));assert.ok(validateProject(project(initialWorkspace,[{id:'unsafe-led',type:'led',port:'J3'}])));
});
