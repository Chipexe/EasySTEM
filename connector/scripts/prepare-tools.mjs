import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const resource=path.join(root,'resources/arduino');
fs.mkdirSync(resource,{recursive:true});
const flag=process.argv.indexOf('--cli');
const source=flag>=0?process.argv[flag+1]:process.env.ARDUINO_CLI_PATH||path.join(process.env.LOCALAPPDATA||'','Programs/Arduino IDE/resources/app/lib/backend/resources/arduino-cli.exe');
const cli=path.join(resource,'arduino-cli.exe');
if(!fs.existsSync(cli)){if(!source||!fs.existsSync(source))throw new Error('Không tìm thấy Arduino CLI. Dùng --cli <đường dẫn arduino-cli.exe chính thức>.');fs.copyFileSync(source,cli);}
const config=path.join(resource,'prepare-config.json');
fs.writeFileSync(config,JSON.stringify({directories:{data:path.join(resource,'data'),downloads:path.join(resource,'downloads'),user:path.join(resource,'user')},build_cache:{path:path.join(resource,'cache')},updater:{enable_notification:false}},null,2));
function run(args){const result=spawnSync(cli,[...args,'--config-file',config],{stdio:'inherit',windowsHide:true});if(result.status!==0)throw new Error(`Arduino CLI ${args[0]} thất bại (${result.status}).`);}
run(['core','update-index']);
run(['core','install','arduino:avr@1.8.8']);
run(['lib','install','Servo@1.3.0']);
fs.writeFileSync(path.join(resource,'manifest.json'),JSON.stringify({core:'arduino:avr@1.8.8',servo:'1.3.0',platform:'win32',arch:'x64',preparedAt:new Date().toISOString()},null,2));
console.log('Đã chuẩn bị công cụ Nano, AVR và Servo để đóng gói offline.');
