import crypto from 'node:crypto';
import {StringDecoder} from 'node:string_decoder';
export const API_PORT=17431;
export const MAX_CODE_BYTES=120000;
export const profiles={nano:'arduino:avr:nano:cpu=atmega328','nano-old':'arduino:avr:nano:cpu=atmega328old'};
export function validOrigin(origin){
 try{const url=new URL(origin);return url.origin===origin&&(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)));}catch{return false;}
}
export function checkSketch(body){
 if(!body||typeof body.code!=='string'||Buffer.byteLength(body.code)>MAX_CODE_BYTES||!body.code.trim())throw new Error('Mã Arduino trống hoặc vượt giới hạn 120 KB.');
 if(!Object.hasOwn(profiles,body.profile))throw new Error('Chọn Nano ATmega328P hoặc Nano Old Bootloader.');
 if(!/void\s+setup\s*\(/.test(body.code)||!/void\s+loop\s*\(/.test(body.code))throw new Error('Chương trình cần có setup() và loop().');
 const clean=body.code.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,token=>token.startsWith('/')?token.replace(/[^\n]/g,' '):'"literal"');
 const directives=clean.split('\n').filter(line=>/^\s*#/.test(line));
 if(directives.some(line=>!/^\s*#include\s*<(Arduino\.h|math\.h|Servo\.h)>\s*$/.test(line)))throw new Error('Bản Connector này chỉ hỗ trợ thư viện Arduino, math và Servo của EasySTEM.');
 if(/\\\r?\n/.test(body.code))throw new Error('Không hỗ trợ chỉ thị nối dòng trong mã nhập.');
 return {code:body.code,profile:body.profile};
}
export class Pairing {
 constructor(){this.reset();}
 reset(){this.code=String(crypto.randomInt(100000,1000000));this.sessions=new Map();this.failures=new Map();this.instance=crypto.randomUUID();}
 pair(origin,code){
  if(!validOrigin(origin))throw new Error('Nguồn trang web không hợp lệ.');
  const attempt=this.failures.get(origin)||{count:0,at:Date.now()};
  if(Date.now()-attempt.at>60000){attempt.count=0;attempt.at=Date.now();}
  if(attempt.count>=5)throw new Error('Đã nhập sai nhiều lần. Vui lòng chờ một phút.');
  const supplied=Buffer.from(String(code||'')),expected=Buffer.from(this.code);
  if(supplied.length!==expected.length||!crypto.timingSafeEqual(supplied,expected)){attempt.count++;this.failures.set(origin,attempt);throw new Error('Mã ghép nối không đúng. Xem mã trong ứng dụng Connector.');}
  this.failures.delete(origin);const token=crypto.randomBytes(32).toString('hex');this.sessions.set(token,{origin,expires:Date.now()+12*60*60*1000});return token;
 }
 authorize(origin,authorization){const token=String(authorization||'').replace(/^Bearer /,'');const session=this.sessions.get(token);return !!session&&session.origin===origin&&session.expires>Date.now();}
 get origins(){return [...new Set([...this.sessions.values()].filter(s=>s.expires>Date.now()).map(s=>s.origin))];}
}
export class TelemetryParser {
 constructor(onSample,onLog=()=>{}){this.buffer='';this.decoder=new StringDecoder('utf8');this.onSample=onSample;this.onLog=onLog;}
 feed(chunk){
  this.buffer+=this.decoder.write(chunk);if(this.buffer.length>32768){this.buffer='';return;}
  let end;while((end=this.buffer.indexOf('\n'))>=0){const line=this.buffer.slice(0,end).trim();this.buffer=this.buffer.slice(end+1);if(!line)continue;
   try{const packet=JSON.parse(line);if(packet.type==='sensor'&&typeof packet.id==='string'&&packet.id.length<=100&&typeof packet.port==='string'&&Number.isFinite(packet.value))this.onSample({...packet,receivedAt:Date.now()});else this.onLog(line.slice(0,300));}catch{this.onLog(line.slice(0,300));}
  }
 }
}
