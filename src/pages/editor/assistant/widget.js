import { askAssistant,assistantStatus } from '../../assistant/assistant.client.js';
import { renderAnswer,copyText } from '../../assistant/message-view.js';
import { captureBlocks } from './capture.js';
export function mountEditorAssistant(root,getContext){
 const host=document.createElement('div');host.className='ed-help';
 host.innerHTML=`<button class="ed-help-launcher" type="button" aria-label="Mở trợ lý bài học" aria-expanded="false" aria-controls="ed-help-panel"><span aria-hidden="true">🤖</span><span class="ed-help-label">Hỏi trợ lý</span></button><section class="ed-help-panel" id="ed-help-panel" aria-labelledby="ed-help-title" hidden><header><div><strong id="ed-help-title">🤖 Trợ lý bài học</strong><small>Đồng hành cùng dự án của bạn</small></div><button type="button" class="ed-help-close" aria-label="Đóng trợ lý">×</button></header><div class="ed-help-scroll"><p class="ed-help-welcome">Xin chào! Bạn đang làm dự án nào và cần mình giúp gì? Mình chỉ hỗ trợ nội dung bài học STEM và EasySTEM nhé.</p><div class="ed-help-messages" role="log" aria-live="polite" aria-label="Trao đổi với trợ lý"></div></div><form class="ed-help-form"><label>Dự án đang làm<input name="project" maxlength="80" required placeholder="Ví dụ: Tưới cây tự động" /></label><label>Bạn cần giúp gì?<textarea name="question" maxlength="2000" required rows="3" placeholder="Ví dụ: Vì sao độ ẩm thấp nhưng bơm chưa chạy?"></textarea></label><p class="ed-help-privacy">Khi gửi, ảnh khối lệnh hiện tại, mã Arduino, thiết bị đã khai báo và nội dung trao đổi sẽ được gửi tới Gemini. Chỉ chụp vùng Blockly.</p><details class="ed-help-preview" hidden><summary>Ảnh code gửi gần nhất</summary><img alt="Ảnh vùng khối lệnh đã gửi tới trợ lý" /></details><p class="ed-help-error" role="alert" hidden></p><div class="ed-help-actions"><button class="ed-help-reset" type="button">Cuộc trò chuyện mới</button><button class="ed-help-submit" type="submit">Gửi kèm ảnh code ↗</button></div></form></section>`;
 root.append(host);
 const $=s=>host.querySelector(s),launcher=$('.ed-help-launcher'),panel=$('.ed-help-panel'),form=$('form'),project=form.elements.project,question=form.elements.question,submit=$('.ed-help-submit'),reset=$('.ed-help-reset'),error=$('.ed-help-error');
 const stop=document.createElement('button');stop.type='button';stop.className='ed-help-stop';stop.textContent='Dừng';stop.hidden=true;$('.ed-help-actions').append(stop);
 const service=document.createElement('p');service.className='ed-help-service';service.setAttribute('role','status');service.textContent='Đang kiểm tra dịch vụ…';$('.ed-help-welcome').after(service);
 const lifetime=new AbortController();
 let messages=[],disposed=false,busy=false,controller=null,projectIdentity=null;
 function append(role,text){const node=document.createElement('div');node.className=`ed-help-message ed-help-message--${role}`;const label=document.createElement('small');label.textContent=role==='user'?'Bạn':'Trợ lý EasySTEM';const body=document.createElement('div');body.className='assistant-message-content';if(role==='assistant'){renderAnswer(body,text);const copy=document.createElement('button');copy.type='button';copy.className='assistant-copy';copy.textContent='Sao chép';copy.onclick=()=>copyText(text,copy);body.append(copy);}else{const p=document.createElement('p');p.textContent=text;body.append(p);}node.append(label,body);$('.ed-help-messages').append(node);$('.ed-help-scroll').scrollTop=$('.ed-help-scroll').scrollHeight;}
 function clear(){messages=[];$('.ed-help-messages').replaceChildren();$('.ed-help-preview').hidden=true;$('.ed-help-preview img').removeAttribute('src');error.hidden=true;}
 function setOpen(open){panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));if(open){let context;try{context=getContext();}catch{}if(!busy&&context&&projectIdentity!==context.name){clear();project.value=context.name;projectIdentity=context.name;}if(!busy)project.focus();}else launcher.focus();}
 launcher.onclick=()=>setOpen(panel.hidden);$('.ed-help-close').onclick=()=>setOpen(false);
 host.onkeydown=e=>{if(e.key==='Escape'&&!panel.hidden){e.stopPropagation();setOpen(false);}};
 reset.onclick=()=>{clear();question.value='';question.focus();};
 stop.onclick=()=>controller?.abort();
 assistantStatus(lifetime.signal).then(status=>{if(!disposed)service.textContent=status.configured?'Gemini đã được cấu hình trên máy chủ.':'Gemini chưa có API key trên máy chủ; chưa thể trả lời thật.';}).catch(()=>{if(!disposed)service.textContent='Chưa kiểm tra được dịch vụ. Hãy kiểm tra mạng hoặc máy chủ.';});
 form.onsubmit=async e=>{
  e.preventDefault();if(busy)return;
  const text=question.value.trim(),name=project.value.trim();if(!text||!name)return;
  let context;
  try{context=getContext();}catch{error.textContent='Chưa đọc được dự án. Hãy kiểm tra khối lệnh rồi gửi lại.';error.hidden=false;return;}
  if(!context){error.textContent='Hãy chờ Blockly tải xong rồi gửi lại.';error.hidden=false;return;}
  if(projectIdentity!==context.name){clear();projectIdentity=context.name;}
  busy=true;stop.hidden=false;submit.disabled=true;reset.disabled=true;project.disabled=true;question.disabled=true;submit.textContent='Đang xem code…';error.hidden=true;controller=new AbortController();
  try{
   const image=await captureBlocks(context.workspace);if(disposed)return;if(controller.signal.aborted)throw new DOMException('Cancelled','AbortError');
   $('.ed-help-preview img').src=`data:${image.mimeType};base64,${image.data}`;$('.ed-help-preview').hidden=false;
   const reply=await askAssistant({question:text,history:messages.slice(-12),project:{name,board:context.board,devices:context.devices,code:context.code,issues:context.issues},image},controller.signal);
   if(disposed||controller.signal.aborted)return;
   append('user',text);append('assistant',reply.answer);messages.push({role:'user',text},{role:'assistant',text:reply.answer});messages=messages.slice(-12);question.value='';
  }catch(err){if(!disposed){error.textContent=controller.signal.aborted?'Đã dừng yêu cầu. Câu hỏi được giữ để bạn gửi lại.':err.message||'Chưa gửi được câu hỏi. Hãy thử lại.';error.hidden=false;}}
  finally{busy=false;if(!disposed){stop.hidden=true;submit.disabled=false;reset.disabled=false;project.disabled=false;question.disabled=false;submit.textContent='Gửi kèm ảnh code ↗';if(!panel.hidden)question.focus();}}
 };
 return ()=>{disposed=true;lifetime.abort();controller?.abort();host.remove();};
}
