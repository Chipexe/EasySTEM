// Capture only Blockly blocks, never the student's desktop, camera or other tabs.
function copyStyles(source,target){
 const style=getComputedStyle(source);
 for(const property of ['fill','fill-opacity','stroke','stroke-width','stroke-opacity','opacity','font-family','font-size','font-weight','font-style','text-anchor','dominant-baseline','display','visibility','paint-order'])target.style.setProperty(property,style.getPropertyValue(property));
 target.removeAttribute('filter');target.style.filter='none';
 for(let i=0;i<source.children.length;i++)copyStyles(source.children[i],target.children[i]);
}
export async function captureBlocks(workspace){
 if(!workspace?.getCanvas())throw new Error('Hãy chờ vùng Blockly tải xong.');
 const source=workspace.getCanvas(),box=source.getBBox(),padding=24;
 const width=Math.max(360,box.width+padding*2),height=Math.max(180,box.height+padding*2),scale=Math.min(1.6,2000/width,2000/height);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width',String(Math.ceil(width*scale)));svg.setAttribute('height',String(Math.ceil(height*scale)));svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
 const background=document.createElementNS(svg.namespaceURI,'rect');background.setAttribute('width','100%');background.setAttribute('height','100%');background.setAttribute('fill','#fcfdff');svg.append(background);
 const blocks=source.cloneNode(true);copyStyles(source,blocks);blocks.setAttribute('transform',`translate(${padding-box.x},${padding-box.y})`);
 blocks.querySelectorAll('foreignObject,script,image').forEach(el=>el.remove());svg.append(blocks);
 if(!source.children.length){const text=document.createElementNS(svg.namespaceURI,'text');text.setAttribute('x','24');text.setAttribute('y','60');text.setAttribute('fill','#526184');text.textContent='Chưa có khối lệnh';svg.append(text);}
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}));
 try{
  const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Không chụp được khối lệnh. Hãy mở tab Khối lệnh và thử lại.'));image.src=url;});
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);canvas.getContext('2d').drawImage(image,0,0);
  const data=canvas.toDataURL('image/png').split(',')[1];if(data.length>2800000)throw new Error('Ảnh code quá lớn. Hãy thu gọn khối lệnh rồi thử lại.');
  return {mimeType:'image/png',data};
 }finally{URL.revokeObjectURL(url);}
}
