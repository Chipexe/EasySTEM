import {SerialPort} from 'serialport';
import {TelemetryParser} from './protocol.js';
export class Hardware {
 constructor(onChange=()=>{}){this.onChange=onChange;this.connection=null;this.samples={};this.logs=[];this.connectionError='';this.selection=null;}
 async ports(){return (await SerialPort.list()).map(p=>({path:p.path,manufacturer:p.manufacturer||'',serialNumber:p.serialNumber||'',vendorId:p.vendorId||'',productId:p.productId||''}));}
 log(text){this.logs.push({time:Date.now(),text:String(text).slice(-2000)});this.logs=this.logs.slice(-40);this.onChange();}
 async connect(port,baudRate=115200){
  if(![9600,57600,115200].includes(baudRate))throw new Error('Tốc độ Serial không được hỗ trợ.');
  if(!(await this.ports()).some(p=>p.path===port))throw new Error('Cổng USB không còn tồn tại. Hãy cắm lại mạch và quét cổng.');
  await this.disconnect();this.connectionError='';this.samples={};this.selection={port,baudRate};
  const serial=new SerialPort({path:port,baudRate,autoOpen:false});this.connection=serial;
  const parser=new TelemetryParser(packet=>{this.samples[packet.id]=packet;this.onChange();},text=>this.log(text));
  serial.on('data',chunk=>parser.feed(chunk));serial.on('error',error=>{this.connectionError=error.message;this.onChange();});serial.on('close',()=>{if(this.connection===serial)this.connection=null;this.onChange();});
  try{await new Promise((resolve,reject)=>serial.open(error=>error?reject(error):resolve()));}catch(error){this.connection=null;throw error;}this.onChange();return this.status();
 }
 async disconnect(){const serial=this.connection;this.connection=null;if(serial?.isOpen)await new Promise(resolve=>serial.close(()=>resolve()));this.onChange();}
 status(){return {connected:!!this.connection?.isOpen,selection:this.selection,error:this.connectionError,samples:this.samples,logs:this.logs};}
}
