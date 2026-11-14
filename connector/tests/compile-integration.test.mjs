import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Blockly from '../../node_modules/blockly/core-node.js';
import '../../node_modules/blockly/blocks_compressed.js';
import * as vi from '../../node_modules/blockly/msg/vi.mjs';
import {registerBlocks} from '../../src/pages/editor/blockly/blocks.js';
import {generateArduino} from '../../src/pages/editor/blockly/arduino-generator.js';
import {initialDevices} from '../../src/pages/editor/editor.board.js';
import {ArduinoTools} from '../src/arduino.js';
const root=path.resolve(import.meta.dirname,'..'),resources=path.join(root,'resources/arduino');
Blockly.setLocale(vi);registerBlocks(Blockly);
const number=n=>({shadow:{type:'math_number',fields:{NUM:n}}});
const chain=(...items)=>items.reduceRight((next,item)=>({...item,...(next?{next:{block:next}}:{})}),null);
test('real AVR compilation: Nano new/old bootloader with telemetry, Servo and numeric logic',{skip:!fs.existsSync(path.join(resources,'manifest.json')),timeout:120000},async()=>{
 const devices=[...initialDevices,{id:'servo',type:'servo',port:'J12'},{id:'button',type:'button',port:'J10'}];
 const state={variables:[{id:'v1',name:'count',type:''}],blocks:{blocks:[{type:'es_forever',inputs:{DO:{block:chain(
  {type:'es_servo',fields:{DEVICE:'servo'},inputs:{ANGLE:number(90)}},
  {type:'controls_if',extraState:{hasElse:true},inputs:{IF0:{block:{type:'es_button',fields:{DEVICE:'button'}}},DO0:{block:{type:'es_load',fields:{DEVICE:'pump',ACTION:'ON'}}},ELSE:{block:{type:'es_load',fields:{DEVICE:'pump',ACTION:'OFF'}}}}},
  {type:'controls_for',fields:{VAR:{id:'v1'}},inputs:{FROM:number(1),TO:number(3),BY:number(1),DO:{block:{type:'es_wait',fields:{UNIT:'MILLISECONDS'},inputs:{TIME:number(10)}}}}},
  {type:'es_serial_print',inputs:{VALUE:{block:{type:'es_distance',fields:{DEVICE:'ultrasonic'}}}}}
 )}}}]}};
 const w=new Blockly.Workspace();w.stemDevices=devices;
 try{Blockly.serialization.workspaces.load(state,w);const result=generateArduino(w,devices);assert.deepEqual(result.errors,[]);const tools=new ArduinoTools(resources,path.join(root,'.test-data/integration'));for(const profile of ['nano','nano-old']){const value=await tools.compile({code:result.code,profile});assert.ok(value.job);const build=tools.jobs.get(value.job);assert.ok(fs.existsSync(path.join(build.build,'EasySTEM.ino.hex')));}}finally{w.dispose();}
});
