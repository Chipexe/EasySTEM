// Wiring agreed with the board owner. J14 pin order: GND, A0, A1, +5V.
export const ports = {
 J1:{digital:'D10',resistor:true}, J4:{digital:'D11',resistor:true}, J3:{digital:'D13'}, J6:{digital:'D12'},
 J8:{analog:'A7',digital:'D2'}, J9:{analog:'A6',digital:'D3'}, J10:{analog:'A2',digital:'D4'}, J11:{analog:'A3',digital:'D5'},
 J12:{signal:'A4'}, J13:{signal:'A5'}, J14:{trig:'A0',echo:'A1'},
 'J15-A':{in1:'D6',in2:'D7'}, 'J15-B':{in1:'D8',in2:'D9'}
};
const sensorPorts=['J8','J9','J10','J11'];
export const deviceTypes = {
 ultrasonic:{name:'Cảm biến siêu âm',emoji:'📡',ports:['J14'],sensor:true,unit:'cm',sample:'24.6'},
 soil:{name:'Độ ẩm đất',emoji:'🌱',ports:sensorPorts,sensor:true,analog:true,unit:'ADC',sample:'680'},
 infrared:{name:'Cảm biến hồng ngoại',emoji:'🔎',ports:sensorPorts,sensor:true,unit:'',sample:'0'},
 flame:{name:'Cảm biến lửa',emoji:'🔥',ports:sensorPorts,sensor:true,analog:true,unit:'ADC',sample:'240'},
 gas:{name:'Cảm biến gas',emoji:'☁️',ports:sensorPorts,sensor:true,analog:true,unit:'ADC',sample:'310'},
 rain:{name:'Cảm biến mưa',emoji:'🌧️',ports:sensorPorts,sensor:true,analog:true,unit:'ADC',sample:'520'},
 light:{name:'Cảm biến ánh sáng',emoji:'☀️',ports:sensorPorts,sensor:true,analog:true,unit:'ADC',sample:'720'},
 led:{name:'Đèn LED',emoji:'💡',ports:['J1','J4']},
 servo:{name:'Servo',emoji:'⚙️',ports:['J12','J13']},
 motor:{name:'Động cơ DC',emoji:'🔧',ports:['J15-A','J15-B']},
 pump:{name:'Máy bơm',emoji:'💧',ports:['J15-A','J15-B']},
 fan:{name:'Quạt',emoji:'🌀',ports:['J15-A','J15-B']},
 button:{name:'Nút nhấn',emoji:'🔘',ports:sensorPorts,sensor:true,unit:'',sample:'1'}
};
export const portLabel = port => port.startsWith('J15-') ? `J15 · Kênh ${port.slice(-1)}` : port;
export function pinDescription(device) {
 const p=ports[device.port]; if(!p) return '';
 if(p.trig) return `TRIG: ${p.trig} · ECHO: ${p.echo}`;
 if(p.in1) return `IN${device.port==='J15-A'?'1':'3'}: ${p.in1} · IN${device.port==='J15-A'?'2':'4'}: ${p.in2}`;
 if(p.signal) return `Tín hiệu: ${p.signal}`;
 if(deviceTypes[device.type]?.analog) return `Analog: ${p.analog}`;
 return `${p.digital}${p.resistor?' · Qua điện trở':''}`;
}
export function validateDevices(devices) {
 if(!Array.isArray(devices) || devices.length>20) return 'Danh sách thiết bị không hợp lệ.';
 const used=new Set(), ids=new Set();
 for(const d of devices) {
  if(!d || typeof d.id!=='string' || !d.id.length || d.id.length>100 || ids.has(d.id) || !deviceTypes[d.type]?.ports?.includes(d.port)) return 'Thiết bị hoặc cổng không hợp lệ.';
  if(used.has(d.port)) return `${portLabel(d.port)} đã được sử dụng. Mỗi cổng chỉ khai báo một thiết bị.`;
  used.add(d.port); ids.add(d.id);
 }
 return '';
}
export const initialDevices = [
 {id:'ultrasonic',type:'ultrasonic',port:'J14'}, {id:'soil',type:'soil',port:'J8'}, {id:'led',type:'led',port:'J1'},
 {id:'pump',type:'pump',port:'J15-A'}, {id:'fan',type:'fan',port:'J15-B'}
];
