export const conversationKey='easystem.gemini.conversations.v2';
export function normalizeConversations(value){
 const raw=Array.isArray(value)?{chats:value}:value;
 const ids=new Set();
 const chats=(Array.isArray(raw?.chats)?raw.chats:[]).filter(c=>c&&typeof c.id==='string'&&c.id.length<=100&&!ids.has(c.id)&&ids.add(c.id)&&typeof c.title==='string'&&Array.isArray(c.messages)).slice(0,30).map(c=>({
  id:c.id,title:c.title.slice(0,80)||'Cuộc trò chuyện STEM',updatedAt:Number.isFinite(c.updatedAt)?c.updatedAt:0,
  messages:c.messages.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.text==='string').slice(-100).map((m,i)=>({id:typeof m.id==='string'?m.id.slice(0,100):`${c.id}-${i}`,role:m.role,text:m.text.slice(0,10000),status:m.status==='pending'?'interrupted':['done','failed','cancelled','interrupted'].includes(m.status)?m.status:'done'}))
 }));
 return {chats,active:chats.some(c=>c.id===raw?.active)?raw.active:null};
}
export function modelHistory(messages){
 // Failed, cancelled and unfinished questions must not become an answered turn.
 const history=[];
 for(let i=0;i<messages.length-1;i++){
  const user=messages[i],answer=messages[i+1];
  if(user.role==='user'&&user.status==='done'&&answer.role==='assistant'&&answer.status==='done'){history.push({role:'user',text:user.text},{role:'assistant',text:answer.text});i++;}
 }
 return history.slice(-12);
}
export function serializeConversations(state){
 const data=JSON.parse(JSON.stringify(state));
 data.chats=data.chats.slice(0,30);
 // Bound browser storage without discarding the current conversation first.
 while(JSON.stringify(data).length>700000){
  const removable=data.chats.findLastIndex(c=>c.id!==data.active);
  if(removable>=0)data.chats.splice(removable,1);
  else if(data.chats[0]?.messages.length>2)data.chats[0].messages.splice(0,2);
  else break;
 }
 return data;
}
