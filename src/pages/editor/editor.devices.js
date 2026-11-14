import { icon } from '../../components/icons.js';
import { escapeHtml, showDialog, closeDialog } from '../../components/ui.js';
import { deviceTypes, portLabel, pinDescription, validateDevices } from './editor.board.js';
export function renderDevices(container, devices, onChange) {
 container.innerHTML=devices.length?devices.map(d=>`<article class="ed-device"><span class="ed-device-emoji" aria-hidden="true">${deviceTypes[d.type].emoji}</span><div class="ed-device-info"><strong>${deviceTypes[d.type].name}</strong><span>${portLabel(d.port)}</span><small>${pinDescription(d)}</small></div><div class="ed-device-actions"><button data-edit-device="${escapeHtml(d.id)}" aria-label="Chỉnh ${deviceTypes[d.type].name}">✎</button><button data-delete-device="${escapeHtml(d.id)}" aria-label="Xóa ${deviceTypes[d.type].name}">${icon('trash')}</button></div></article>`).join(''):'<p class="ed-empty">Chưa khai báo thiết bị. Thêm linh kiện đang cắm vào mạch để bắt đầu.</p>';
 container.onclick=e=>{
  const edit=e.target.closest('[data-edit-device]'), del=e.target.closest('[data-delete-device]');
  if(edit) deviceDialog(devices,onChange,edit.dataset.editDevice);
  if(del) {
   const d=devices.find(d=>d.id===del.dataset.deleteDevice);
   showDialog('Xóa thiết bị?',`<p class="modal-copy">Xóa ${deviceTypes[d.type].name} tại ${portLabel(d.port)} khỏi cấu hình dự án?</p><button class="btn btn-primary btn-full" id="ed-confirm-remove">Xóa thiết bị</button>`,dialog=>{dialog.querySelector('button#ed-confirm-remove').onclick=()=>{onChange(devices.filter(item=>item.id!==d.id));closeDialog();};});
  }
 };
}
export function deviceDialog(devices,onChange,id) {
 const current=devices.find(d=>d.id===id);
 showDialog(current?'Chỉnh thiết bị':'Thêm thiết bị',`<form id="ed-device-form"><div class="field"><label for="ed-device-type">Loại linh kiện</label><select id="ed-device-type">${Object.entries(deviceTypes).map(([key,d])=>`<option value="${key}" ${current?.type===key?'selected':''}>${d.emoji} ${d.name}</option>`).join('')}</select></div><div class="field"><label for="ed-device-port">Cổng trên mạch mở rộng</label><select id="ed-device-port" required></select></div><p class="ed-wiring-help" id="ed-wiring-help"></p><p class="form-error" role="alert" hidden></p><button class="btn btn-primary btn-full" type="submit">${current?'Lưu thay đổi':'Thêm thiết bị'}</button></form><p class="demo-note">Chọn đúng linh kiện đang cắm. Kiểm tra thứ tự tín hiệu, +5V và GND theo dây thực tế; tên cổng không thay thế việc kiểm tra dây.</p>`,dialog=>{
  const type=dialog.querySelector('#ed-device-type'), port=dialog.querySelector('#ed-device-port');
  function help() {
   const value={type:type.value,port:port.value};
   let extra=type.value==='ultrasonic'?'J14: 1 GND · 2 TRIG/A0 · 3 ECHO/A1 · 4 +5V.':
    ['pump','fan','motor'].includes(type.value)?'Qua L298N, không dùng PWM. ENA/ENB phải ở trạng thái cho phép; dùng nguồn tải phù hợp và chung GND.':
    type.value==='led' && ['J3','J6'].includes(port.value)?'Cổng này chưa có điện trở nối tiếp trên sơ đồ; LED rời cần điện trở phù hợp.':
    deviceTypes[type.value].analog?'Đọc tín hiệu AO. Giá trị ADC 0–1023; phần trăm cần hiệu chuẩn cảm biến.':type.value==='button'?'Nút nhấn nối chân tín hiệu digital và GND; dự kiến dùng INPUT_PULLUP.':'';
   dialog.querySelector('#ed-wiring-help').textContent=port.value?`${pinDescription(value)}. ${extra}`:'Không còn cổng trống cho loại linh kiện này.';
  }
  function options() {
   port.innerHTML=deviceTypes[type.value].ports.map(p=>{const busy=devices.some(d=>d.id!==id&&d.port===p);return `<option value="${p}" ${busy?'disabled':''}>${portLabel(p)}${busy?' — Đã dùng':''}</option>`;}).join('');
   const available=deviceTypes[type.value].ports.filter(p=>!devices.some(d=>d.id!==id&&d.port===p));
   port.value=available.includes(current?.port)?current.port:available[0]||'';
   dialog.querySelector('[type="submit"]').disabled=!available.length;help();
  }
  type.onchange=options;port.onchange=help;options();
  dialog.querySelector('form').onsubmit=e=>{e.preventDefault();const value={id:current?.id||crypto.randomUUID(),type:type.value,port:port.value};const next=current?devices.map(d=>d.id===id?value:d):[...devices,value];const error=validateDevices(next);if(error){const el=dialog.querySelector('.form-error');el.hidden=false;el.textContent=error;return;}onChange(next);closeDialog();};
 });
}
