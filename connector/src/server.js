import http from 'node:http';
import {Pairing,validOrigin,API_PORT} from './protocol.js';
export function createConnectorServer({hardware,tools,onChange=()=>{},port=API_PORT}) {
 const pairing=new Pairing();let busy=false,stage='',lastError='';
 const state=()=>({service:'EasySTEM Connector',version:'0.1.0',instance:pairing.instance,toolsReady:tools.ready,busy,stage,lastError,...hardware.status()});
 async function exclusive(label,action){if(busy)throw new Error('Connector đang xử lý một tác vụ khác.');busy=true;stage=label;lastError='';onChange();try{return await action();}catch(error){lastError=error.message;throw error;}finally{busy=false;stage='';onChange();}}
 const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin;
  const address=server.address();
  if(req.headers.host!==`127.0.0.1:${address?.port}`){res.writeHead(403).end();return;}
  if(!validOrigin(origin)){res.writeHead(403).end();return;}
  res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Cache-Control','no-store');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Private-Network','true');
  if(req.method==='OPTIONS'){res.writeHead(204).end();return;}
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  try {
   const route=new URL(req.url,'http://127.0.0.1').pathname;
   if(route==='/health'&&req.method==='GET'){send(200,{service:'EasySTEM Connector',version:'0.1.0',instance:pairing.instance});return;}
   if(route!=='/pair'&&!pairing.authorize(origin,req.headers.authorization)){send(401,{error:'Cần ghép nối với EasySTEM Connector.'});return;}
   let body={};
   if(req.method==='POST'){
    let text='';for await(const chunk of req){text+=chunk.toString();if(Buffer.byteLength(text)>140000)throw new Error('Yêu cầu quá lớn.');}
    try{body=JSON.parse(text||'{}');}catch{throw new Error('Dữ liệu JSON không hợp lệ.');}
   }
   if(route==='/pair'&&req.method==='POST'){const token=pairing.pair(origin,body.code);onChange();send(200,{token,instance:pairing.instance});return;}
   if(route==='/api/status'&&req.method==='GET'){send(200,state());return;}
   if(route==='/api/ports'&&req.method==='GET'){send(200,{ports:await hardware.ports()});return;}
   if(route==='/api/connect'&&req.method==='POST'){send(200,await exclusive('Kết nối USB',()=>hardware.connect(body.port,body.baudRate||115200)));return;}
   if(route==='/api/disconnect'&&req.method==='POST'){await exclusive('Ngắt USB',()=>hardware.disconnect());send(200,{ok:true});return;}
   if(route==='/api/compile'&&req.method==='POST'){send(200,await exclusive('Đang biên dịch chương trình',()=>tools.compile(body)));return;}
   if(route==='/api/upload'&&req.method==='POST'){
    const result=await exclusive('Đang nạp vào Arduino Nano',async()=>{
     if(typeof body.job!=='string'||!(await hardware.ports()).some(p=>p.path===body.port))throw new Error('Cổng nạp không hợp lệ hoặc đã bị rút.');
     const previous=hardware.status();await hardware.disconnect();
     try{await tools.upload(body.job,body.port);return {ok:true};}
     finally{if(previous.connected){try{await hardware.connect(body.port,previous.selection?.baudRate||115200);}catch(error){hardware.log(`Không đọc lại được USB: ${error.message}`);}}}
    });send(200,result);return;
   }
   send(404,{error:'Không có chức năng này.'});
  }catch(error){send(400,{error:error.message});}
 });
 server.headersTimeout=10000;server.requestTimeout=30000;
 return {server,pairing,state,async start(){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});return server.address().port;},async stop(){await hardware.disconnect();await new Promise(resolve=>server.close(resolve));}};
}
