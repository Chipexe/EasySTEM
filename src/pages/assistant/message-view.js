// Build a small safe subset of formatting with DOM nodes; never render model HTML.
function inline(parent,text){
 for(const part of text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g)){
  const node=part.startsWith('`')&&part.endsWith('`')?document.createElement('code'):part.startsWith('**')&&part.endsWith('**')?document.createElement('strong'):null;
  if(node){node.textContent=part.slice(node.tagName==='CODE'?1:2,node.tagName==='CODE'?-1:-2);parent.append(node);}else parent.append(document.createTextNode(part));
 }
}
export function renderAnswer(container,text){
 container.replaceChildren();
 const sections=String(text).split(/```([^\n`]*)\n([\s\S]*?)(?:```|$)/g);
 for(let i=0;i<sections.length;i+=3){
  if(sections[i]){const p=document.createElement('p');inline(p,sections[i]);container.append(p);}
  if(i+2<sections.length){const wrap=document.createElement('div');wrap.className='assistant-code';const head=document.createElement('div');head.className='assistant-code-heading';const label=document.createElement('span');label.textContent=sections[i+1].slice(0,30)||'Mã';const copy=document.createElement('button');copy.type='button';copy.textContent='Sao chép mã';copy.onclick=()=>copyText(sections[i+2],copy);head.append(label,copy);const pre=document.createElement('pre'),code=document.createElement('code');code.textContent=sections[i+2];pre.append(code);wrap.append(head,pre);container.append(wrap);}
 }
}
export async function copyText(text,button){
 const original=button.textContent;
 try{await navigator.clipboard.writeText(text);button.textContent='Đã sao chép';}catch{button.textContent='Chưa sao chép được';}
 setTimeout(()=>{if(button.isConnected)button.textContent=original;},1800);
}
