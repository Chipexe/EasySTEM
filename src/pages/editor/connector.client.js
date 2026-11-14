import {showDialog,closeDialog,escapeHtml,toast} from '../../components/ui.js';
const base='http://127.0.0.1:17431';
export class ConnectorClient {
 constructor(onState){this.onState=onState;this.status=null;this.selection=null;this.timer=null;this.disposed=false;this.polling=false;try{this.token=sessionStorage.getItem('easystem.connector.token')||'';}catch{this.token='';}}
 async request(route,body,timeout=4000){
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),timeout);
  try {
   const response=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(this.token?{Authorization:`Bearer ${this.token}`}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:abort.signal});
   const value=await response.json();if(!response.ok){if(response.status===401){this.token='';try{sessionStorage.removeItem('easystem.connector.token');}catch{}}throw new Error(value.error||'Connector không nhận yêu cầu.');}return value;
  }catch(error){if(error.name==='AbortError')throw new Error('Connector chưa phản hồi hoặc đang xử lý lâu. Hãy kiểm tra ứng dụng.');if(error instanceof TypeError)throw new Error('Không kết nối được Connector. Hãy mở ứng dụng và cho phép kết nối cục bộ nếu trình duyệt hỏi.');throw error;}finally{clearTimeout(timer);}
 }
 async poll(){if(this.polling||this.disposed||!this.token)return;this.polling=true;try{this.status=await this.request('/api/status');if(!this.disposed)this.onState(this.status);}catch(error){if(!this.disposed){this.status={connected:false,error:error.message,samples:{}};this.onState(this.status);}}finally{this.polling=false;}}
 startPolling(){clearInterval(this.timer);this.timer=setInterval(()=>this.poll(),500);this.poll();}
 async open(){
  try{await this.request('/health');if(this.token){try{await this.request('/api/status');await this.portDialog();return;}catch{this.token='';}}
   showDialog('Ghép nối EasySTEM Connector','<p class="modal-copy">Mở ứng dụng EasySTEM Connector và nhập mã 6 chữ số đang hiển thị. Mã này cho phép trang EasySTEM kết nối USB và nạp code trên máy bạn.</p><form id="ed-pair-form"><div class="field"><label for="ed-pair-code">Mã trong ứng dụng Connector</label><input id="ed-pair-code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off" required placeholder="Nhập 6 chữ số" /></div><p class="form-error" role="alert" hidden></p><button class="btn btn-primary btn-full" type="submit">Ghép nối với máy này</button></form>',dialog=>{
    dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const button=dialog.querySelector('[type="submit"]');button.disabled=true;try{const value=await this.request('/pair',{code:dialog.querySelector('input').value});this.token=value.token;try{sessionStorage.setItem('easystem.connector.token',this.token);}catch{}closeDialog();await this.portDialog();}catch(error){const el=dialog.querySelector('.form-error');el.hidden=false;el.textContent=error.message;button.disabled=false;}};
   });
  }catch(error){showDialog('Chưa kết nối ứng dụng hỗ trợ',`<p class="modal-copy">${escapeHtml(error.message)}</p><p>Hãy mở EasySTEM Connector trên máy tính rồi thử lại. Không có phản hồi chưa có nghĩa là máy chưa cài ứng dụng.</p>`);}
 }
 async portDialog(){
  const {ports}=await this.request('/api/ports');
  showDialog('Chọn Arduino Nano',`<p class="modal-copy">Chọn đúng cổng USB và bootloader của mạch. Dùng dây USB có truyền dữ liệu.</p><form id="ed-port-form"><div class="field"><label for="ed-usb-port">Cổng kết nối</label><select id="ed-usb-port" required>${ports.length?ports.map(p=>`<option value="${escapeHtml(p.path)}">${escapeHtml(p.path)} — ${escapeHtml(p.manufacturer||'Thiết bị nối tiếp')}</option>`).join(''):'<option value="">Chưa thấy cổng USB</option>'}</select></div><div class="field"><label for="ed-board-profile">Loại Nano</label><select id="ed-board-profile"><option value="nano">Nano ATmega328P</option><option value="nano-old">Nano ATmega328P — Old Bootloader</option></select></div><p class="form-error" role="alert" hidden></p><div class="ed-open-options"><button class="btn btn-primary btn-full" type="submit" ${ports.length?'':'disabled'}>Kết nối và đọc dữ liệu</button><button class="btn btn-outline btn-full" type="button" id="ed-refresh-usb">Quét lại cổng</button></div></form><p class="demo-note">Chương trình trên Nano cần gửi số đo theo định dạng EasySTEM. Nếu chưa có, hãy nạp chương trình Blockly hiện tại. Đóng Serial Monitor trong Arduino IDE trước khi kết nối.</p>`,dialog=>{
   if(this.selection){dialog.querySelector('#ed-usb-port').value=this.selection.port;dialog.querySelector('#ed-board-profile').value=this.selection.profile;}
   dialog.querySelector('#ed-refresh-usb').onclick=async()=>{closeDialog();try{await this.portDialog();}catch(error){toast(error.message);}};
   dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const button=dialog.querySelector('[type="submit"]');button.disabled=true;try{const port=dialog.querySelector('#ed-usb-port').value,profile=dialog.querySelector('#ed-board-profile').value;await this.request('/api/connect',{port,baudRate:115200},10000);this.selection={port,profile};closeDialog();this.startPolling();toast(`Đã kết nối ${port}. Đang chờ số đo từ Nano.`);}catch(error){const el=dialog.querySelector('.form-error');el.hidden=false;el.textContent=error.message;button.disabled=false;}};
  });
 }
 async disconnect(){await this.request('/api/disconnect',{});await this.poll();}
 async upload(code){
  if(!this.selection){await this.open();return false;}
  this.onState({...this.status,busy:true,stage:'Đang biên dịch chương trình'});
  try{const build=await this.request('/api/compile',{code,profile:this.selection.profile},200000);if(this.disposed)throw new Error('Đã rời trang, chưa nạp chương trình vào mạch.');this.onState({...this.status,busy:true,stage:'Đang nạp chương trình'});await this.request('/api/upload',{job:build.job,port:this.selection.port},110000);this.startPolling();return true;}finally{await this.poll();}
 }
 dispose(){this.disposed=true;clearInterval(this.timer);}
}
