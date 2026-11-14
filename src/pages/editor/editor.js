import { icon } from '../../components/icons.js';
import { escapeHtml,toast,loadLocal,saveLocal,showDialog,closeDialog } from '../../components/ui.js';
import { initialDevices } from './editor.board.js';
import { renderDevices,deviceDialog } from './editor.devices.js';
import { renderMonitor } from './editor.monitor.js';
import { workspaceMarkup } from './editor.workspace.js';
import { loadBlockly } from './blockly/loader.js';
import { createWorkspace } from './blockly/workspace.js';
import { initialWorkspace } from './blockly/toolbox.js';
import { projectKey,draftKey,validateProject,downloadFile,safeFilename } from './blockly/project.js';
import { ConnectorClient } from './connector.client.js';
import { mountEditorAssistant } from './assistant/widget.js';
const clone=value=>JSON.parse(JSON.stringify(value));

export function editorPage(root) {
 let disposed=false,editor,Blockly,devices=clone(initialDevices),sample=false,lastSnapshot,undo=[],redo=[],lastGroup=null,suppress=false,draftTimer,result,live=null,uploading=false;
 root.innerHTML=`<section class="ed-page"><div class="ed-title-strip"><span>🚀 Khởi tạo dự án STEM</span><small>Cùng lắp ráp, lập trình và khám phá</small><span aria-hidden="true">🤖</span></div><div class="ed-toolbar"><label class="ed-project-name">✎ <input id="project-name" aria-label="Tên dự án" maxlength="80" value="Đèn LED nhấp nháy" /></label><div class="ed-project-actions"><button class="btn btn-purple" id="new-project" disabled>${icon('plus')} Dự án mới</button><button class="btn btn-outline" id="open-project" disabled>${icon('folder')} Mở</button><button class="btn btn-outline" id="save-project" disabled>${icon('save')} Lưu</button><button class="icon-button" id="ed-undo" aria-label="Hoàn tác" disabled>↶</button><button class="icon-button" id="ed-redo" aria-label="Làm lại" disabled>↷</button></div><span class="ed-board-label">🔹 Arduino Nano · Mạch mở rộng</span><button class="btn btn-outline" id="ed-connect">${icon('plus')} Kết nối</button><button class="btn btn-orange" id="ed-upload">↑ Nạp chương trình</button></div><div class="ed-layout"><aside class="ed-device-panel"><div class="ed-panel-heading"><h2>🔹 Thiết bị đã khai báo</h2></div><button class="btn btn-primary btn-full" id="ed-add-device" disabled>${icon('plus')} Thêm thiết bị</button><p class="ed-panel-copy">Chọn linh kiện và cổng đang cắm.</p><div id="ed-device-list" class="ed-device-list"></div><div class="ed-config-status">✓ Cấu hình cổng hợp lệ</div><p class="ed-device-note">Cấu hình ban đầu là ví dụ. Hãy chỉnh theo linh kiện thực tế của bạn.</p></aside><section class="ed-code-panel" aria-label="Lập trình">${workspaceMarkup()}</section><aside class="ed-monitor" aria-label="Giá trị cảm biến" id="ed-monitor"></aside></div><input type="file" accept=".json,application/json" id="ed-project-file" hidden /></section>`;
 const $=selector=>root.querySelector(selector);
 const disposeAssistant=mountEditorAssistant(root,()=>{
  if(!editor)return null;
  const generated=editor.generate();
  return {name:$('#project-name').value,board:'nano-expansion-v1',devices:clone(devices),workspace:editor.workspace,code:generated.code,issues:[...generated.errors,...generated.warnings].map(issue=>issue.message)};
 });
 function snapshot(){return {version:3,board:'nano-expansion-v1',name:$('#project-name').value,devices:clone(devices),workspace:editor.save(),view:{scale:editor.workspace.scale}};}
 function key(project){const {view,...content}=project;return JSON.stringify(content);}
 function writeDraft(){if(!editor||disposed)return;const value=snapshot();if(!validateProject(value))saveLocal(draftKey,value);}
 function scheduleDraft(){clearTimeout(draftTimer);draftTimer=setTimeout(writeDraft,500);}
 function update() {
  if(disposed||!editor)return;
  result=editor.generate();$('#ed-source-code').textContent=result.code;
  const status=$('#ed-generation-status');status.classList.toggle('has-error',!!result.errors.length);
  status.textContent=result.errors.length?`⚠ Có ${result.errors.length} lỗi cần sửa trước khi tải code.`:result.warnings.length?'ⓘ Thêm chương trình để bắt đầu.':'✓ Khối lệnh hợp lệ · Mã Arduino đã cập nhật';
  const issues=[...result.errors,...result.warnings];$('#ed-validation').hidden=!issues.length;
  $('#ed-validation-summary').textContent=`Xem ${issues.length} thông báo`;
  $('#ed-issues').innerHTML=issues.map(issue=>`<li>${issue.blockId?`<button data-issue-block="${escapeHtml(issue.blockId)}">${escapeHtml(issue.message)}</button>`:escapeHtml(issue.message)}</li>`).join('');
  $('#ed-download-ino').disabled=!!result.errors.length||!!result.warnings.length;
  $('#block-count').textContent=`${editor.workspace.getAllBlocks(false).filter(b=>!b.isShadow()).length} khối lệnh`;
  $('#ed-zoom-level').textContent=`${Math.round(editor.workspace.scale*100)}%`;
  $('#ed-undo').disabled=!undo.length;$('#ed-redo').disabled=!redo.length;
 }
 function record(group=null) {
  if(suppress||disposed||!editor)return;
  const current=snapshot();
  if(lastSnapshot&&key(current)!==key(lastSnapshot)) {
   if(!group||group!==lastGroup)undo.push(lastSnapshot);
   if(undo.length>50)undo.shift();redo=[];lastGroup=group;
  }
  lastSnapshot=current;update();scheduleDraft();
 }
 const connector=new ConnectorClient(status=>{if(disposed)return;live=status;if(status.connected)sample=false;monitor();$('#ed-connect').textContent=status.connected?`USB: ${status.selection?.port||''}`:'Kết nối';$('#ed-upload').textContent=status.busy?status.stage:'↑ Nạp chương trình';$('#ed-upload').disabled=uploading||!!status.busy;});
 function monitor(){renderMonitor($('#ed-monitor'),devices,sample,value=>{sample=value;monitor();},live,async()=>{try{if(live?.connected)await connector.disconnect();else await connector.open();}catch(error){toast(error.message);}});}
 function devicePanels(){
  renderDevices($('#ed-device-list'),devices,next=>{devices=next;editor.setDevices(devices);devicePanels();record();});
  monitor();
 }
 function restore(project){
  suppress=true;
  try {devices=clone(project.devices);$('#project-name').value=project.name;editor.setDevices(devices);editor.load(project.workspace,devices);editor.workspace.setScale(project.view?.scale||.85);sample=false;devicePanels();lastSnapshot=snapshot();lastGroup=null;}
  finally{suppress=false;}
  update();scheduleDraft();
 }
 function replace(project){const before=snapshot();try{restore(project);undo.push(before);if(undo.length>50)undo.shift();redo=[];update();}catch(error){restore(before);toast(`Không mở được dự án: ${error.message}`);}}
 function confirmAction(title,copy,action){showDialog(title,`<p class="modal-copy">${copy}</p><button id="ed-confirm" class="btn btn-primary btn-full">Xác nhận</button>`,dialog=>{dialog.querySelector('#ed-confirm').onclick=()=>{action();closeDialog();};});}
 function selectTab(tab){const source=tab.id==='ed-source-tab';for(const t of [$('#ed-block-tab'),$('#ed-source-tab')]){t.setAttribute('aria-selected',t===tab);t.tabIndex=t===tab?0:-1;}$('#ed-block-view').hidden=source;$('#ed-source-view').hidden=!source;if(!source)requestAnimationFrame(()=>{if(!disposed)editor?.resize();});}
 $('#ed-connect').onclick=()=>connector.open();
 $('#ed-upload').onclick=async()=>{
  if(!editor){toast('Hãy chờ Blockly tải xong.');return;}update();if(result.errors.length||result.warnings.length){toast('Hãy sửa khối lệnh trước khi nạp.');return;}
  if(!connector.selection){await connector.open();return;}
  showDialog('Nạp vào Arduino Nano?',`<p class="modal-copy">Nạp chương trình hiện tại vào <strong>${escapeHtml(connector.selection.port)}</strong> sẽ thay thế chương trình đang có trên mạch. Khi mạch khởi động, LED, động cơ, máy bơm hoặc quạt sẽ hoạt động theo các khối bạn đã ghép.</p><p class="demo-note">Kiểm tra dây và nguồn tải trước khi nạp. Đọc cảm biến sẽ tạm dừng trong lúc nạp rồi kết nối lại.</p><button id="ed-confirm-upload" class="btn btn-orange btn-full">Biên dịch và nạp chương trình</button>`,dialog=>{
   const code=result.code;dialog.querySelector('#ed-confirm-upload').onclick=async()=>{closeDialog();uploading=true;$('#ed-upload').disabled=true;try{const done=await connector.upload(code);if(done)toast('Đã nạp chương trình. Nano có thể chạy độc lập khi được cấp nguồn.');}catch(error){if(!disposed)showDialog('Chưa nạp được chương trình',`<p class="modal-copy ed-upload-error">${escapeHtml(error.message)}</p>`);}finally{uploading=false;if(!disposed){$('#ed-upload').disabled=false;$('#ed-upload').textContent='↑ Nạp chương trình';}}};
  });
 };
 // Keep the route lifecycle synchronous; dispose safely even while the library is loading.
 loadBlockly().then(library=>{
  if(disposed)return;Blockly=library;
  editor=createWorkspace(Blockly,$('#ed-blockly-host'),devices,event=>{if(event.ui){update();return;}record(event.group);});
  const draft=loadLocal(draftKey,null);
  if(draft&&!validateProject(draft)){try{restore(draft);}catch{editor.load(initialWorkspace,devices);}}
  devicePanels();lastSnapshot=snapshot();
  for(const id of ['#new-project','#open-project','#save-project','#ed-add-device'])$(id).disabled=false;
  $('#ed-add-device').onclick=()=>deviceDialog(devices,next=>{devices=next;editor.setDevices(devices);devicePanels();record();});
  $('#project-name').onchange=()=>record();
  $('#ed-undo').onclick=()=>{if(!undo.length)return;const current=snapshot(),previous=undo.pop();redo.push(current);restore(previous);update();};
  $('#ed-redo').onclick=()=>{if(!redo.length)return;const current=snapshot(),next=redo.pop();undo.push(current);restore(next);update();};
  $('#clear-blocks').onclick=()=>confirmAction('Xóa các khối lệnh?','Bạn có thể dùng Hoàn tác để khôi phục.',()=>{replace({...snapshot(),workspace:{}});});
  $('#new-project').onclick=()=>confirmAction('Tạo dự án mới?','Tạo dự án trống, giữ nguyên bản đã lưu. Bạn có thể hoàn tác.',()=>replace({version:3,board:'nano-expansion-v1',name:'Dự án của em',devices:[],workspace:{},view:{scale:.85}}));
  $('#save-project').onclick=()=>{const project=snapshot(),error=validateProject(project);if(error){toast(error);return;}if(saveLocal(projectKey,project)){writeDraft();toast('Đã lưu khối lệnh, tham số và thiết bị trên trình duyệt này.');}};
  $('#ed-export-project').onclick=()=>{const project=snapshot(),error=validateProject(project);if(error){toast(error);return;}downloadFile(`${safeFilename(project.name)}.json`,JSON.stringify(project,null,2),'application/json');};
  $('#open-project').onclick=()=>showDialog('Mở dự án Blockly','<p class="modal-copy">Nội dung đang chỉnh sửa sẽ được thay thế. Dự án giao diện v1/v2 vẫn được giữ riêng.</p><div class="ed-open-options"><button class="btn btn-primary btn-full" id="ed-open-local">Mở bản đã lưu trên trình duyệt</button><button class="btn btn-outline btn-full" id="ed-open-file">Chọn file dự án .json</button></div>',dialog=>{
   dialog.querySelector('#ed-open-local').onclick=()=>{const project=loadLocal(projectKey,null);if(!project){toast('Chưa có dự án Blockly được lưu.');return;}const error=validateProject(project);if(error){toast(error);return;}replace(project);closeDialog();};
   dialog.querySelector('#ed-open-file').onclick=()=>{closeDialog();$('#ed-project-file').click();};
  });
  $('#ed-project-file').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>1000000){toast('File dự án tối đa 1 MB.');return;}try{const project=JSON.parse(await file.text());if(disposed)return;const error=validateProject(project);if(error){toast(error);return;}confirmAction('Mở file dự án?',`Thay thế nội dung đang chỉnh sửa bằng “${escapeHtml(project.name)}”?`,()=>replace(project));}catch{toast('Không đọc được file JSON của dự án.');}};
  $('#ed-download-ino').onclick=()=>{update();if(result.errors.length||result.warnings.length){toast('Hãy sửa các thông báo trước khi tải code.');return;}downloadFile(`${safeFilename($('#project-name').value)}.ino`,result.code);};
  root.querySelectorAll('[data-zoom]').forEach(btn=>btn.onclick=()=>{if(btn.dataset.zoom==='fit')editor.workspace.zoomToFit();else editor.workspace.zoomCenter(btn.dataset.zoom==='in'?1:-1);update();});
  $('#ed-issues').onclick=e=>{const btn=e.target.closest('[data-issue-block]');if(btn){selectTab($('#ed-block-tab'));editor.workspace.centerOnBlock(btn.dataset.issueBlock);editor.workspace.highlightBlock(btn.dataset.issueBlock);}};
  const tabs=[$('#ed-block-tab'),$('#ed-source-tab')];tabs.forEach((tab,i)=>{tab.onclick=()=>selectTab(tab);tab.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?tabs[0]:e.key==='End'?tabs[1]:tabs[1-i];selectTab(next);next.focus();}};});
  update();
 }).catch(error=>{if(disposed)return;$('#ed-blockly-host').innerHTML='<p class="ed-loading">Không tải được Blockly. Hãy chạy npm install và tải lại trang.</p>';$('#ed-generation-status').textContent=error.message;});
 function flush(){clearTimeout(draftTimer);writeDraft();}
 window.addEventListener('pagehide',flush);
 return ()=>{flush();disposed=true;disposeAssistant();connector.dispose();window.removeEventListener('pagehide',flush);editor?.dispose();};
}
