import { validateDevices } from '../editor.board.js';
import { supportedTypes } from './toolbox.js';
export const projectKey='easystem.nano.project.v3';
export const draftKey='easystem.nano.draft.v3';
export function validateProject(project) {
 if(!project||project.version!==3||project.board!=='nano-expansion-v1')return 'File không đúng định dạng dự án Nano Blockly phiên bản 3.';
 if(typeof project.name!=='string'||!project.name.trim()||project.name.length>80)return 'Tên dự án không hợp lệ.';
 const devicesError=validateDevices(project.devices);if(devicesError)return devicesError;
 if(!project.workspace||typeof project.workspace!=='object'||Array.isArray(project.workspace))return 'Thiếu dữ liệu Blockly.';
 if(JSON.stringify(project).length>1000000)return 'Dự án quá lớn (tối đa 1 MB).';
 let count=0;
 function check(block,depth=0) {
  if(!block||typeof block!=='object'||depth>80||++count>300)throw new Error('Dự án vượt giới hạn 300 khối hoặc lồng quá sâu.');
  if(!supportedTypes.has(block.type))throw new Error(`Loại khối không được hỗ trợ: ${String(block.type).slice(0,60)}.`);
  if(block.fields)for(const value of Object.values(block.fields)) {
   if(typeof value==='string'&&value.length>500)throw new Error('Nội dung một ô quá dài.');
   if(typeof value==='number'&&!Number.isFinite(value))throw new Error('Giá trị số không hợp lệ.');
  }
  if(block.extraState) {
   if(block.type!=='controls_if')throw new Error('Trạng thái mở rộng của khối không hợp lệ.');
   const n=block.extraState.elseIfCount??0;
   if(!Number.isInteger(n)||n<0||n>10)throw new Error('Tối đa 10 nhánh nếu không thì.');
  }
  if(block.inputs)for(const connection of Object.values(block.inputs)) {if(connection.block)check(connection.block,depth+1);if(connection.shadow)check(connection.shadow,depth+1);}
  if(block.next?.block)check(block.next.block,depth+1);
 }
 try {
  const roots=project.workspace.blocks?.blocks||[];
  if(!Array.isArray(roots))return 'Danh sách khối không hợp lệ.';
  roots.forEach(b=>check(b));
  const variables=project.workspace.variables||[];
  if(!Array.isArray(variables)||variables.length>100||variables.some(v=>!v||typeof v.name!=='string'||v.name.length>100||typeof v.id!=='string'||(v.type!==undefined&&v.type!=='')))return 'Danh sách biến không hợp lệ.';
 }catch(error){return error.message;}
 if(project.view&&(!Number.isFinite(project.view.scale)||project.view.scale<.4||project.view.scale>1.6))return 'Độ phóng không hợp lệ.';
 return '';
}
export function downloadFile(name,text,type='text/plain;charset=utf-8') {
 const url=URL.createObjectURL(new Blob([text],{type}));
 const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export const safeFilename=name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^a-zA-Z0-9_-]/g,'_').replace(/_+/g,'_').slice(0,60)||'EasySTEM';
