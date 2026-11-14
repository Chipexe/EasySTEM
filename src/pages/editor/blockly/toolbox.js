const number=n=>({shadow:{type:'math_number',fields:{NUM:n}}});
const block=(type,inputs)=>({kind:'block',type,...(inputs?{inputs}:{})});
export const toolbox={kind:'categoryToolbox',contents:[
 {kind:'category',name:'🚩 Cơ bản',colour:'#cf9b1d',contents:[block('es_start'),block('es_forever'),block('es_serial_print',{VALUE:{shadow:{type:'text',fields:{TEXT:'Xin chào EasySTEM!'}}}})]},
 {kind:'category',name:'◇ Logic',colour:'#8b5bc3',contents:[block('controls_if'),block('logic_compare',{A:number(0),B:number(600)}),block('logic_operation'),block('logic_negate'),block('logic_boolean')]},
 {kind:'category',name:'↻ Vòng lặp',colour:'#e6a02f',contents:[block('controls_repeat_ext',{TIMES:number(10)}),block('controls_whileUntil',{BOOL:{shadow:{type:'logic_boolean',fields:{BOOL:'TRUE'}}}}),block('controls_for',{FROM:number(1),TO:number(10),BY:number(1)}),block('controls_flow_statements')]},
 {kind:'category',name:'＋ Toán học',colour:'#59983b',contents:[block('math_number'),block('math_arithmetic',{A:number(1),B:number(1)}),block('math_modulo',{DIVIDEND:number(10),DIVISOR:number(3)}),block('math_random_int',{FROM:number(1),TO:number(10)}),block('math_single',{NUM:number(9)}),block('text')]},
 {kind:'category',name:'{x} Biến',colour:'#c85491',custom:'VARIABLE'},
 {kind:'category',name:'📡 Cảm biến',colour:'#288cbd',contents:[block('es_distance'),block('es_analog'),block('es_digital'),block('es_button')]},
 {kind:'category',name:'⚙ Thiết bị',colour:'#35a34c',contents:[block('es_led'),block('es_load'),block('es_motor'),block('es_servo',{ANGLE:number(90)})]},
 {kind:'category',name:'◷ Thời gian',colour:'#8855ca',contents:[block('es_wait',{TIME:number(1)}),block('es_millis')]}
]};
const chain=(...items)=>items.reduceRight((next,item)=>({...item,...(next?{next:{block:next}}:{})}),null);
export const initialWorkspace={blocks:{languageVersion:0,blocks:[
 {type:'es_start',id:'start-root',x:35,y:25},
 {type:'es_forever',id:'forever-root',x:35,y:125,inputs:{DO:{block:chain(
  {type:'es_led',fields:{DEVICE:'led',ACTION:'ON'}},
  {type:'es_wait',fields:{UNIT:'SECONDS'},inputs:{TIME:number(1)}},
  {type:'es_led',fields:{DEVICE:'led',ACTION:'OFF'}},
  {type:'es_wait',fields:{UNIT:'SECONDS'},inputs:{TIME:number(1)}}
 )}}}
]}};
export const supportedTypes=new Set(['es_start','es_forever','es_wait','es_led','es_load','es_motor','es_servo','es_distance','es_analog','es_digital','es_button','es_serial_print','es_millis','controls_if','logic_compare','logic_operation','logic_negate','logic_boolean','controls_repeat_ext','controls_whileUntil','controls_for','controls_flow_statements','math_number','math_arithmetic','math_modulo','math_random_int','math_single','text','variables_get','variables_set','math_change']);
