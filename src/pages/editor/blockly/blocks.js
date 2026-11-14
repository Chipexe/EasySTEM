import { deviceTypes, portLabel } from '../editor.board.js';

export const deviceBlockTypes = {
 es_led:['led'], es_servo:['servo'], es_motor:['motor'], es_load:['pump','fan'],
 es_distance:['ultrasonic'], es_analog:['soil','flame','gas','rain','light'],
 es_digital:['infrared','soil','flame','gas','rain','light','button'], es_button:['button']
};
export function deviceOptions(block) {
 if(!block)return [['Chưa khai báo thiết bị','NONE']];
 const workspace=block.workspace.isFlyout?block.workspace.targetWorkspace:block.workspace;
 const devices=workspace?.stemDevices||[];
 const types=deviceBlockTypes[block.type]||[];
 const options=devices.filter(d=>types.includes(d.type)).map(d=>[`${deviceTypes[d.type].name} · ${portLabel(d.port)}`,d.id]);
 const selected=block.getField('DEVICE')?.pendingDeviceId||block.getFieldValue('DEVICE');
 if(selected && selected!=='NONE' && !options.some(([,id])=>id===selected)) options.push(['⚠ Thiết bị đã xóa hoặc đổi loại',selected]);
 return options.length?options:[['Chưa khai báo thiết bị','NONE']];
}
export function registerBlocks(Blockly) {
 if(Blockly.Blocks.es_start) return;
 // This first Nano release uses numeric variables; prevent invalid C++ assignments.
 const setInit=Blockly.Blocks.variables_set.init,getInit=Blockly.Blocks.variables_get.init;
 Blockly.Blocks.variables_set.init=function(){setInit.call(this);this.getInput('VALUE').setCheck('Number');this.setTooltip('Gán một giá trị số cho biến.');};
 Blockly.Blocks.variables_get.init=function(){getInit.call(this);this.setOutput(true,'Number');this.setTooltip('Đọc biến số.');};
 const statement=function(block,colour){block.setPreviousStatement(true);block.setNextStatement(true);block.setColour(colour);};
 class DeviceDropdown extends Blockly.FieldDropdown {
  loadState(value){
   // Preserve references to deleted/retyped devices when loading a saved project.
   this.pendingDeviceId=typeof value==='string'?value:null;
   this.getOptions(false);
   super.loadState(value);
   this.pendingDeviceId=null;
  }
 }
 const dropdown=block=>new DeviceDropdown(()=>deviceOptions(block));
 for(const [type,title] of [['es_start','🚩 Khi bắt đầu'],['es_forever','↻ Lặp liên tục']]) {
  Blockly.Blocks[type]={init(){this.appendDummyInput().appendField(title);this.appendStatementInput('DO');this.setColour(type==='es_start'?45:32);this.setTooltip(type==='es_start'?'Chạy một lần trong setup(). Mỗi dự án chỉ có một khối này.':'Chạy lặp lại trong loop(). Mỗi dự án chỉ có một khối này.');}};
 }
 Blockly.Blocks.es_wait={init(){this.appendValueInput('TIME').setCheck('Number').appendField('đợi');this.appendDummyInput().appendField(new Blockly.FieldDropdown([['giây','SECONDS'],['mili giây','MILLISECONDS']]),'UNIT');this.setInputsInline(true);statement(this,265);this.setTooltip('Thời gian chờ không âm.');}};
 Blockly.Blocks.es_led={init(){this.appendDummyInput().appendField(new Blockly.FieldDropdown([['bật','ON'],['tắt','OFF'],['đảo trạng thái','TOGGLE']]),'ACTION').appendField('LED').appendField(dropdown(this),'DEVICE');statement(this,120);}};
 Blockly.Blocks.es_servo={init(){this.appendDummyInput().appendField('quay servo').appendField(dropdown(this),'DEVICE');this.appendValueInput('ANGLE').setCheck('Number').appendField('đến góc');this.appendDummyInput().appendField('độ');this.setInputsInline(true);statement(this,120);this.setTooltip('Góc được giới hạn từ 0 đến 180 độ.');}};
 Blockly.Blocks.es_motor={init(){this.appendDummyInput().appendField('động cơ').appendField(dropdown(this),'DEVICE').appendField(new Blockly.FieldDropdown([['quay thuận','FORWARD'],['quay nghịch','REVERSE'],['dừng','STOP']]),'DIRECTION');statement(this,120);this.setTooltip('Điều khiển L298N bằng mức digital, không PWM.');}};
 Blockly.Blocks.es_load={init(){this.appendDummyInput().appendField(new Blockly.FieldDropdown([['bật','ON'],['tắt','OFF']]),'ACTION').appendField(dropdown(this),'DEVICE');statement(this,120);this.setTooltip('Máy bơm hoặc quạt nối qua L298N; không nối trực tiếp chân Nano.');}};
 for(const [type,title,output] of [['es_distance','khoảng cách (cm)','Number'],['es_analog','giá trị analog (0–1023)','Number'],['es_digital','trạng thái digital (0/1)','Number'],['es_button','nút đang nhấn?','Boolean']]) {
  Blockly.Blocks[type]={init(){this.appendDummyInput().appendField(title).appendField(dropdown(this),'DEVICE');this.setOutput(true,output);this.setColour(205);this.setTooltip(type==='es_distance'?'Giá trị -1 nếu không nhận được Echo trong 30 ms.':type==='es_analog'?'Giá trị ADC thô; chưa quy đổi sang phần trăm.':type==='es_button'?'Nút nối chân digital và GND, dùng INPUT_PULLUP.':'Đọc chân digital; cực tính phát hiện tùy module.');}};
 }
 Blockly.Blocks.es_serial_print={init(){this.appendValueInput('VALUE').appendField('gửi Serial');statement(this,205);this.setTooltip('Gửi một dòng qua Serial ở 9600 baud.');}};
 Blockly.Blocks.es_millis={init(){this.appendDummyInput().appendField('thời gian đã chạy (ms)');this.setOutput(true,'Number');this.setColour(265);}};
}

export function refreshDeviceFields(Blockly,workspace,devices) {
 workspace.stemDevices=devices;
 Blockly.Events.disable();
 try {
  for(const block of workspace.getAllBlocks(false)) {
   const field=block.getField('DEVICE');if(!field)continue;
   const value=field.getValue();
   field.setOptions(function(){return deviceOptions(this.getSourceBlock());});
   if(value && value!=='NONE') field.setValue(value);
  }
 } finally {Blockly.Events.enable();}
 workspace.getFlyout?.()?.getWorkspace()?.getAllBlocks(false).forEach(block=>{
  const field=block.getField('DEVICE');if(field)field.setOptions(function(){return deviceOptions(this.getSourceBlock());});
 });
}
