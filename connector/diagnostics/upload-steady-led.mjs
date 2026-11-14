// Explicit, manual real-hardware diagnostic. Not part of the automatic tests.
import fs from 'node:fs';
import path from 'node:path';
import {Hardware} from '../src/hardware.js';
import {ArduinoTools} from '../src/arduino.js';
import {createConnectorServer} from '../src/server.js';

const port=process.argv[2];
if(port!=='COM7')throw new Error('This manual diagnostic is scoped to the confirmed Nano on COM7.');
const root=path.resolve(import.meta.dirname,'..');
const code='#include <Arduino.h>\nvoid setup(){ for(uint8_t p=6;p<=9;p++){digitalWrite(p,LOW);pinMode(p,OUTPUT);} pinMode(10,OUTPUT);pinMode(11,OUTPUT);digitalWrite(10,HIGH);digitalWrite(11,HIGH);}\nvoid loop(){}\n';
const work=path.join(root,'.test-data','steady-led-api');
fs.mkdirSync(work,{recursive:true});fs.writeFileSync(path.join(work,'LED_J1_J4_ON.ino'),code);
const hardware=new Hardware();
const tools=new ArduinoTools(path.join(root,'resources','arduino'),work,text=>{hardware.log(text);process.stdout.write(text);});
const app=createConnectorServer({hardware,tools,port:0});
const number=await app.start(),origin='http://127.0.0.1:5173';let token='';
async function request(route,body){
 const response=await fetch(`http://127.0.0.1:${number}${route}`,{method:body===undefined?'GET':'POST',headers:{Origin:origin,...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(200000)});
 const value=await response.json();if(!response.ok)throw new Error(`${route}: ${value.error}`);return value;
}
try{
 token=(await request('/pair',{code:app.pairing.code})).token;
 if(!(await request('/api/ports')).ports.some(p=>p.path===port))throw new Error('Confirmed COM7 is no longer present.');
 const build=await request('/api/compile',{code,profile:'nano'});
 await request('/api/connect',{port,baudRate:115200});
 console.log('\nMONITOR_CONNECTED; testing API stop-monitor/upload/reconnect');
 await request('/api/upload',{job:build.job,port});
 const status=await request('/api/status');
 const result={date:new Date().toISOString(),port,profile:'nano',mode:'Both LEDs continuously ON',apiUploadSucceeded:true,monitorRestored:status.connected,logs:status.logs};
 fs.writeFileSync(path.join(work,'hardware-result.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({apiUploadSucceeded:true,monitorRestored:status.connected,mode:'Both LEDs continuously ON'}));
}catch(error){console.error(error.message);process.exitCode=1;}
finally{await app.stop();}
