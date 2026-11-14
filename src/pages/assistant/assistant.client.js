export async function assistantStatus(signal){
 const response=await fetch('/api/assistant/status',{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(5000)]):AbortSignal.timeout(5000)});
 if(!response.ok)throw new Error('Không kiểm tra được dịch vụ trợ lý.');
 const data=await response.json();if(typeof data.configured!=='boolean')throw new Error('Máy chủ chưa hỗ trợ trợ lý.');return data;
}
export async function askAssistant(payload,signal){
 let response;
 try{response=await fetch('/api/assistant/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(65000)]):AbortSignal.timeout(65000)});}
 catch(error){if(signal?.aborted)throw error;throw new Error('Không kết nối được trợ lý. Hãy kiểm tra mạng và thử lại.');}
 let data;try{data=await response.json();}catch{throw new Error('Máy chủ chưa hỗ trợ API trợ lý. Hãy chạy phiên bản máy chủ mới.');}
 if(!response.ok)throw new Error(data.error||'Trợ lý chưa phản hồi. Hãy thử lại.');
 if(typeof data.answer!=='string')throw new Error('Phản hồi trợ lý không hợp lệ.');
 return data;
}
