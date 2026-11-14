import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {profiles,checkSketch} from './protocol.js';
export class ArduinoTools {
 constructor(resourceDir,workDir,onLog=()=>{}){
  this.resourceDir=resourceDir;this.workDir=workDir;this.onLog=onLog;this.jobs=new Map();
  fs.mkdirSync(workDir,{recursive:true});this.cli=path.join(resourceDir,'arduino-cli.exe');
  this.config=path.join(workDir,'arduino-config.json');
  fs.writeFileSync(this.config,JSON.stringify({directories:{data:path.join(resourceDir,'data'),downloads:path.join(workDir,'downloads'),user:path.join(resourceDir,'user')},build_cache:{path:path.join(workDir,'cache')},updater:{enable_notification:false}}));
 }
 get ready(){return fs.existsSync(this.cli)&&fs.existsSync(path.join(this.resourceDir,'manifest.json'))&&fs.existsSync(path.join(this.resourceDir,'data/packages/arduino/hardware/avr/1.8.8/platform.txt'));}
 run(args,timeout=180000){return new Promise((resolve,reject)=>{
  const child=spawn(this.cli,[...args,'--config-file',this.config],{windowsHide:true,shell:false});let output='';
  const timer=setTimeout(()=>{child.kill();reject(new Error('Quá thời gian xử lý Arduino.'));},timeout);
  const append=chunk=>{const text=chunk.toString();output=(output+text).slice(-16000);this.onLog(text.slice(-2000));};child.stdout.on('data',append);child.stderr.on('data',append);
  child.on('error',error=>{clearTimeout(timer);reject(error);});child.on('close',code=>{clearTimeout(timer);code===0?resolve(output):reject(new Error(output.trim()||`Arduino CLI kết thúc với mã ${code}.`));});
 });}
 async compile(body){
  const {code,profile}=checkSketch(body);if(!this.ready)throw new Error('Bộ công cụ Nano chưa đầy đủ. Cần dùng bộ cài có Arduino Tools.');
  // Keep all sketches/build artifacts below the private app work directory.
  const job=crypto.randomUUID(),dir=path.join(this.workDir,'jobs',job),sketch=path.join(dir,'EasySTEM'),build=path.join(dir,'build');fs.mkdirSync(sketch,{recursive:true});fs.writeFileSync(path.join(sketch,'EasySTEM.ino'),code);
  await this.run(['compile','--fqbn',profiles[profile],'--build-path',build,sketch]);
  this.jobs.set(job,{dir,sketch,build,profile,createdAt:Date.now()});
  if(this.jobs.size>10){const [old,value]=this.jobs.entries().next().value;const target=path.resolve(value.dir),allowed=path.resolve(this.workDir,'jobs')+path.sep;if(!target.startsWith(allowed))throw new Error('Đường dẫn dọn bản biên dịch không hợp lệ.');this.jobs.delete(old);fs.rmSync(target,{recursive:true,force:true});}
  return {job,profile};
 }
 async upload(job,port){const entry=this.jobs.get(job);if(!entry||Date.now()-entry.createdAt>3600000)throw new Error('Bản biên dịch đã hết hạn. Hãy biên dịch lại.');return this.run(['upload','--port',port,'--fqbn',profiles[entry.profile],'--input-dir',entry.build,entry.sketch],90000);}
}
