let loading;
function script(src){return new Promise((resolve,reject)=>{const element=document.createElement('script');element.src=src;element.onload=resolve;element.onerror=()=>{element.remove();reject(new Error('Không tải được Blockly. Hãy kiểm tra cài đặt npm và tải lại trang.'));};document.head.append(element);});}
export function loadBlockly(){
 if(!loading) loading=(async()=>{
  await script('/vendor/blockly/blockly_compressed.js');
  await script('/vendor/blockly/blocks_compressed.js');
  await script('/vendor/blockly/msg/vi.js');
  return window.Blockly;
 })().catch(error=>{loading=null;throw error;});
 return loading;
}
