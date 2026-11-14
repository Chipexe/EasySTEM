import { systemInstruction, refusal, followUp } from './policy.mjs';
import { validateDevices } from '../../src/pages/editor/editor.board.js';

export class AssistantError extends Error {
 constructor(status,message){super(message);this.status=status;}
}
function bounded(value,max,label){if(typeof value!=='string'||value.length>max)throw new AssistantError(400,`${label} không hợp lệ hoặc quá dài.`);return value.trim();}
export function validateRequest(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw new AssistantError(400,'Nội dung yêu cầu không hợp lệ.');
 const question=bounded(body.question,2000,'Câu hỏi');if(!question)throw new AssistantError(400,'Hãy nhập nội dung cần giúp.');
 const history=body.history??[];
 if(!Array.isArray(history)||history.length>12)throw new AssistantError(400,'Lịch sử tối đa 12 tin nhắn.');
 const messages=history.map(m=>{if(!m||!['user','assistant'].includes(m.role))throw new AssistantError(400,'Vai trò lịch sử không hợp lệ.');return {role:m.role,text:bounded(m.text,10000,'Tin nhắn')};});
 let project=null;
 if(body.project){
  const p=body.project,name=bounded(p.name,80,'Tên dự án');if(!name)throw new AssistantError(400,'Hãy cho biết bạn đang làm dự án nào.');
  if(p.board!=='nano-expansion-v1'||validateDevices(p.devices))throw new AssistantError(400,'Cấu hình mạch không hợp lệ.');
  project={name,board:p.board,devices:p.devices.map(({id,type,port})=>({id,type,port})),code:bounded(p.code,120000,'Mã Arduino'),issues:(Array.isArray(p.issues)?p.issues:[]).slice(0,30).map(x=>bounded(x,300,'Thông báo khối'))};
 }
 let image=null;
 if(body.image){
  const data=bounded(body.image.data,2800000,'Ảnh Blockly');
  if(body.image.mimeType!=='image/png'||!data.startsWith('iVBORw0KGgo')||data.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(data))throw new AssistantError(400,'Cần ảnh PNG của vùng Blockly.');
  const png=Buffer.from(data,'base64');
  if(png.length<24||png.readUInt32BE(16)>2200||png.readUInt32BE(20)>2200||!png.readUInt32BE(16)||!png.readUInt32BE(20))throw new AssistantError(400,'Kích thước ảnh không hợp lệ.');
  image={mimeType:'image/png',data};
 }
 if(project&&!image)throw new AssistantError(400,'Chưa chụp được vùng Blockly. Hãy thử lại.');
 return {question,history:messages,project,image};
}
export async function askGemini(input,{apiKey,model='gemini-3.8-flash',fetchImpl=fetch,signal}={}){
 if(!apiKey)throw new AssistantError(503,'Trợ lý chưa được cấu hình Gemini API key trên máy chủ.');
 if(!/^gemini-[a-zA-Z0-9.-]+$/.test(model))throw new AssistantError(503,'Cấu hình mô hình Gemini không hợp lệ.');
 const parts=[{text:JSON.stringify({question:input.question,history:input.history,project:input.project})}];
 if(input.image)parts.push({inlineData:input.image});
 let response;
 try{response=await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
  method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(55000)]):AbortSignal.timeout(55000),
  body:JSON.stringify({systemInstruction:{parts:[{text:systemInstruction}]},contents:[{role:'user',parts}],generationConfig:{temperature:.2,maxOutputTokens:4096,responseMimeType:'application/json',responseSchema:{type:'OBJECT',properties:{inScope:{type:'BOOLEAN'},answer:{type:'STRING'}},required:['inScope','answer']}}})
 });}catch{throw new AssistantError(504,'Gemini chưa phản hồi. Hãy thử lại sau ít phút.');}
 if(!response.ok){
  if(response.status===503)throw new AssistantError(503,'Gemini đang quá tải tạm thời. Hãy chờ khoảng 15–30 giây rồi bấm Thử lại câu hỏi. Bạn không cần đổi API key.');
  if(response.status===429)throw new AssistantError(429,'Gemini đang giới hạn lượt gọi hoặc tài khoản đã hết hạn mức. Hãy thử lại sau hoặc kiểm tra hạn mức trong Google AI Studio.');
  if(response.status===404)throw new AssistantError(502,'Mô hình Gemini đã chọn không khả dụng cho tài khoản này. Quản trị viên cần kiểm tra GEMINI_MODEL trên máy chủ.');
  throw new AssistantError(502,'Không gọi được Gemini. Quản trị viên cần kiểm tra quyền API key và cấu hình dịch vụ.');
 }
 let result;
 try{
  const data=await response.json(),candidate=data.candidates?.[0];
  if(candidate?.finishReason!=='STOP')throw new Error('Incomplete answer');
  result=JSON.parse(candidate.content.parts.filter(p=>typeof p.text==='string'&&!p.thought).map(p=>p.text).join(''));
  if(typeof result.inScope!=='boolean'||typeof result.answer!=='string'||!result.answer.trim()||result.answer.length>9000)throw new Error('Invalid answer');
 }catch{throw new AssistantError(502,'Trợ lý chưa tạo được câu trả lời đầy đủ. Hãy viết rõ hơn nội dung cần giúp và thử lại.');}
 return {inScope:result.inScope,answer:result.inScope?`${result.answer.trim()}\n\n${followUp}`:refusal};
}
