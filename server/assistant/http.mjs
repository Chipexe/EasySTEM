import { AssistantError, validateRequest, askGemini } from './gemini.mjs';

const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
export function createAssistantHandler({apiKey=process.env.GEMINI_API_KEY,model=process.env.GEMINI_MODEL||'gemini-3.8-flash',origin=process.env.APP_ORIGIN,fetchImpl=fetch,dailyLimit=Number(process.env.AI_DAILY_LIMIT||200)}={}){
 if(!Number.isSafeInteger(dailyLimit)||dailyLimit<0)dailyLimit=200;
 const visits=new Map();let active=0,day='',daily=0;
 return async(req,res)=>{
  const route=new URL(req.url,'http://localhost').pathname;
  if(!route.startsWith('/api/assistant/'))return false;
  const controller=new AbortController(),cancel=()=>{if(!res.writableEnded)controller.abort();};res.once('close',cancel);
  try{
   if(route==='/api/assistant/status'&&req.method==='GET'){send(res,200,{configured:!!apiKey});return true;}
   if(route!=='/api/assistant/chat'){send(res,404,{error:'Không có API này.'});return true;}
   if(req.method!=='POST'){send(res,405,{error:'Chỉ chấp nhận POST.'});return true;}
   // APP_ORIGIN is required behind a reverse proxy; never trust forwarded headers here.
   const allowed=origin||`http://${req.headers.host}`;
   if(req.headers.origin!==allowed){send(res,403,{error:'Nguồn truy cập không được phép.'});return true;}
   if(!req.headers['content-type']?.startsWith('application/json'))throw new AssistantError(415,'Cần nội dung JSON.');
   if(!apiKey)throw new AssistantError(503,'Trợ lý chưa được cấu hình Gemini API key trên máy chủ.');
   const now=Date.now(),today=new Date(now).toISOString().slice(0,10);
   if(day!==today){day=today;daily=0;}
   for(const [ip,entry]of visits)if(now-entry.start>=3600000)visits.delete(ip);
   const ip=req.socket.remoteAddress,entry=visits.get(ip)||{start:now,count:0};
   if(entry.count>=30||daily>=dailyLimit||active>=2)throw new AssistantError(429,'Trợ lý đang bận hoặc đã đạt giới hạn sử dụng. Hãy thử lại sau.');
   entry.count++;visits.set(ip,entry);
   const chunks=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>3200000)throw new AssistantError(413,'Nội dung gửi quá lớn. Hãy thu gọn dự án.');chunks.push(chunk);}
   let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new AssistantError(400,'Không đọc được JSON.');}
   const input=validateRequest(body);
   // Recheck after reading a slow body so concurrent requests cannot bypass the limits.
   if(active>=2||daily>=dailyLimit)throw new AssistantError(429,'Trợ lý đang bận. Hãy thử lại sau.');
   active++;daily++;
   try{const answer=await askGemini(input,{apiKey,model,fetchImpl,signal:controller.signal});if(!res.destroyed)send(res,200,answer);}finally{active--;}
  }catch(error){if(!res.destroyed)send(res,error instanceof AssistantError?error.status:500,{error:error instanceof AssistantError?error.message:'Không xử lý được yêu cầu trợ lý.'});}
  finally{res.off('close',cancel);}
  return true;
 };
}
