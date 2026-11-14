import { suggestions } from './assistant.data.js';
import { escapeHtml,loadLocal,saveLocal,showDialog,closeDialog,toast } from '../../components/ui.js';
import { askAssistant,assistantStatus } from './assistant.client.js';
import { conversationKey,normalizeConversations,serializeConversations,modelHistory } from './conversations.js';
import { renderAnswer,copyText } from './message-view.js';

export function mountAssistantPage(root){
 const $=s=>root.querySelector(s);
 const old=loadLocal('easystem.gemini.chats.v1',[]);
 let state=normalizeConversations(loadLocal(conversationKey,old)),disposed=false,request=null;
 const lifetime=new AbortController();
 $('.assistant-demo-badge').textContent='Đang kiểm tra dịch vụ…';
 $('.assistant-panel-title small').textContent='Chỉ hỗ trợ bài học STEM';
 $('.assistant-privacy').textContent='Lịch sử chỉ lưu trên trình duyệt này. Câu hỏi và 12 tin gần nhất được gửi tới Gemini; không nhập thông tin cá nhân.';
 $('.chat-disclaimer').textContent='AI có thể nhầm. Kiểm tra dây và nguồn trước khi làm theo; trợ lý không tự nạp code.';
 $('#chat-input').placeholder='Bạn đang làm dự án nào và cần giúp gì?';
 $('.assistant-welcome p').textContent='Bạn đang làm dự án nào và cần mình giúp gì? Mình hỗ trợ bài học STEM, lập trình và linh kiện EasySTEM.';
 const search=document.createElement('input');search.className='assistant-history-search';search.type='search';search.placeholder='Tìm cuộc trò chuyện…';search.setAttribute('aria-label','Tìm cuộc trò chuyện');$('#chat-history').before(search);
 const tools=document.createElement('div');tools.className='assistant-chat-tools';tools.innerHTML='<button type="button" data-rename>Đổi tên</button><button type="button" data-export>Tải hội thoại</button><button type="button" data-delete>Xóa hội thoại</button>';$('.assistant-panel-title').after(tools);
 const notice=document.createElement('p');notice.className='assistant-service-notice';notice.setAttribute('role','status');notice.hidden=true;tools.after(notice);
 const progress=document.createElement('div');progress.className='assistant-progress';progress.hidden=true;progress.innerHTML='<span role="status">Trợ lý đang xem câu hỏi…</span><button type="button">Dừng</button>';$('#chat-form').before(progress);
 const input=$('#chat-input'),submit=$('#chat-form button');
 function current(){return state.chats.find(c=>c.id===state.active);}
 function persist(){saveLocal(conversationKey,serializeConversations(state));}
 function history(){const query=search.value.trim().toLocaleLowerCase('vi');$('#chat-history').innerHTML=state.chats.filter(c=>c.title.toLocaleLowerCase('vi').includes(query)).map(c=>`<button type="button" class="chat-history-item ${c.id===state.active?'active':''}" ${c.id===state.active?'aria-current="true"':''} data-chat="${escapeHtml(c.id)}"><span>💬 ${escapeHtml(c.title)}</span></button>`).join('')||'<p class="history-empty">Chưa có cuộc trò chuyện phù hợp.</p>';}
 function render(){
  const chat=current(),messages=chat?.messages||[];
  tools.hidden=!chat;$('#assistant-suggestions').hidden=messages.length>0;$('.assistant-welcome').hidden=messages.length>0;
  const log=$('#chat-messages');log.replaceChildren();
  messages.forEach((m,i)=>{
   const row=document.createElement('div');row.className=`chat-message chat-message--${m.role}`;
   const avatar=document.createElement('span');avatar.textContent=m.role==='user'?'🧑‍🚀':'🤖';avatar.setAttribute('aria-hidden','true');
   const bubble=document.createElement('div'),label=document.createElement('small'),content=document.createElement('div');content.className='assistant-message-content';label.textContent=m.role==='user'?'Bạn':'Trợ lý EasySTEM';bubble.append(label,content);
   if(m.role==='assistant'){renderAnswer(content,m.text);const copy=document.createElement('button');copy.type='button';copy.className='assistant-copy';copy.textContent='Sao chép câu trả lời';copy.onclick=()=>copyText(m.text,copy);bubble.append(copy);}
   else{const p=document.createElement('p');p.textContent=m.text;content.append(p);}
   if(m.status!=='done'){
    const note=document.createElement('p');note.className='assistant-turn-status';note.textContent={pending:'Đang chờ trả lời…',failed:'Chưa nhận được phản hồi.',cancelled:'Đã dừng yêu cầu.',interrupted:'Lần trả lời trước bị gián đoạn.'}[m.status]||'';bubble.append(note);
    if(m.role==='user'&&m.status!=='pending'&&i===messages.length-1){const retry=document.createElement('button');retry.type='button';retry.className='assistant-retry';retry.textContent='Thử lại câu hỏi';retry.disabled=!!request;retry.onclick=()=>send(m.text,m.id);bubble.append(retry);}
   }
   row.append(avatar,bubble);log.append(row);
  });
  submit.disabled=!!request;progress.hidden=!request;log.setAttribute('aria-busy',String(!!request));
  for(const button of tools.querySelectorAll('button'))button.disabled=!!request;
  history();const scroll=$('.assistant-scroll');scroll.scrollTop=scroll.scrollHeight;
 }
 function stop(){request?.controller.abort();}
 async function checkService(){
  try{const status=await assistantStatus(lifetime.signal);if(disposed)return;$('.assistant-demo-badge').textContent=status.configured?'Gemini · Đã cấu hình':'Gemini · Chưa cấu hình';notice.hidden=status.configured;notice.textContent=status.configured?'':'Máy chủ chưa có Gemini API key. Bạn có thể soạn câu hỏi; quản trị viên cần cấu hình khóa để nhận trả lời.';}
  catch{if(!disposed){$('.assistant-demo-badge').textContent='Chưa kiểm tra được dịch vụ';notice.hidden=false;notice.textContent='Không kiểm tra được máy chủ trợ lý. Hãy kiểm tra mạng hoặc khởi động lại máy chủ phiên bản mới.';}}
 }
 async function send(text,retryId){
  text=text.trim();if(!text||request)return;
  let chat=current();if(!chat){chat={id:crypto.randomUUID(),title:text.slice(0,42),messages:[],updatedAt:Date.now()};state.chats.unshift(chat);state.active=chat.id;}
  let user=retryId?chat.messages.find(m=>m.id===retryId):null;
  if(retryId&&(!user||chat.messages.at(-1)!==user))return;
  const history=modelHistory(user?chat.messages.slice(0,-1):chat.messages);
  if(!user){user={id:crypto.randomUUID(),role:'user',text,status:'pending'};chat.messages.push(user);}else user.status='pending';
  chat.updatedAt=Date.now();state.chats=[chat,...state.chats.filter(c=>c.id!==chat.id)].slice(0,30);
  const task={controller:new AbortController(),chatId:chat.id};request=task;input.value='';notice.hidden=true;persist();render();
  try{
   const reply=await askAssistant({question:text,history},task.controller.signal);
   if(disposed)return;if(task.controller.signal.aborted)throw new Error('Cancelled');
   user.status='done';chat.messages.push({id:crypto.randomUUID(),role:'assistant',text:reply.answer,status:'done'});chat.messages=chat.messages.slice(-100);
  }catch(error){
   user.status=task.controller.signal.aborted?'cancelled':'failed';
   if(!disposed&&!task.controller.signal.aborted){notice.hidden=false;notice.textContent=error.message;}
  }finally{
   request=null;persist();if(!disposed){render();if(state.active===chat.id)input.focus();}
  }
 }
 $('#chat-form').onsubmit=e=>{e.preventDefault();send(input.value);};
 progress.querySelector('button').onclick=stop;
 root.querySelectorAll('[data-suggestion]').forEach(btn=>btn.onclick=()=>send(suggestions[Number(btn.dataset.suggestion)][1]));
 root.querySelectorAll('[data-topic]').forEach(btn=>btn.onclick=()=>{input.value=`Mình muốn tìm hiểu về ${btn.dataset.topic.toLowerCase()}`;input.focus();});
 $('#new-chat').onclick=()=>{if(request){toast('Hãy dừng hoặc chờ câu trả lời trước khi tạo cuộc trò chuyện mới.');return;}state.active=null;input.value='';notice.hidden=true;persist();render();input.focus();};
 $('#chat-history').onclick=e=>{const btn=e.target.closest('[data-chat]');if(!btn)return;if(request){toast('Hãy dừng hoặc chờ câu trả lời trước khi đổi cuộc trò chuyện.');return;}state.active=btn.dataset.chat;notice.hidden=true;persist();render();};
 search.oninput=history;
 tools.querySelector('[data-rename]').onclick=()=>{const chat=current();if(!chat||request)return;showDialog('Đổi tên cuộc trò chuyện','<form id="assistant-rename"><div class="field"><label for="assistant-title">Tên cuộc trò chuyện</label><input id="assistant-title" maxlength="80" required /></div><button class="btn btn-purple" type="submit">Lưu tên</button></form>',dialog=>{const title=dialog.querySelector('input');title.value=chat.title;dialog.querySelector('form').onsubmit=e=>{e.preventDefault();if(!title.value.trim())return;chat.title=title.value.trim();persist();render();closeDialog();};});};
 tools.querySelector('[data-delete]').onclick=()=>{const chat=current();if(!chat||request)return;showDialog('Xóa cuộc trò chuyện?',`<p>Chỉ xóa “${escapeHtml(chat.title)}” khỏi trình duyệt này.</p><button type="button" id="assistant-delete-confirm" class="btn btn-purple">Xóa cuộc trò chuyện</button>`,dialog=>{dialog.querySelector('#assistant-delete-confirm').onclick=()=>{state.chats=state.chats.filter(c=>c.id!==chat.id);state.active=null;persist();render();closeDialog();};});};
 tools.querySelector('[data-export]').onclick=()=>{const chat=current();if(!chat)return;const text=[chat.title,'Lưu ý: câu trả lời do AI tạo, cần kiểm tra.',...chat.messages.map(m=>`${m.role==='user'?'Bạn':'Trợ lý'}${m.status!=='done'?` (${m.status})`:''}:\n${m.text}`)].join('\n\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='EasySTEM-hoi-thoai.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 render();checkService();
 return ()=>{disposed=true;lifetime.abort();stop();};
}
