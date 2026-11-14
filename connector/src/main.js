import {app,BrowserWindow,ipcMain,shell,dialog,Menu,Tray,nativeImage} from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Hardware} from './hardware.js';
import {ArduinoTools} from './arduino.js';
import {createConnectorServer} from './server.js';
const here=path.dirname(fileURLToPath(import.meta.url));
app.disableHardwareAcceleration();
let window,tray,connector,quitting=false;
if(!app.requestSingleInstanceLock()){app.quit();}
else {
 app.on('second-instance',()=>{if(window?.isMinimized())window.restore();window?.show();window?.focus();});
 app.whenReady().then(async()=>{
  const resourceDir=app.isPackaged?path.join(process.resourcesPath,'arduino'):path.resolve(here,'../resources/arduino');
  const workspaceOverride=process.env.EASYSTEM_CONNECTOR_DATA;
  const workDir=workspaceOverride?path.resolve(workspaceOverride):path.join(app.getPath('userData'),'work');
  fs.mkdirSync(workDir,{recursive:true});
  const notify=()=>{if(window&&!window.isDestroyed())window.webContents.send('connector:changed');};
  const hardware=new Hardware(notify),tools=new ArduinoTools(resourceDir,workDir,text=>hardware.log(text));
  connector=createConnectorServer({hardware,tools,onChange:notify});
  try{await connector.start();}catch(error){dialog.showErrorBox('Không mở được EasySTEM Connector',`Cổng 17431 đang được sử dụng hoặc ứng dụng khác đang chạy.\n${error.message}`);app.quit();return;}
  const iconPath=path.join(here,'ui/icon.png');
  window=new BrowserWindow({width:870,height:770,minWidth:700,minHeight:620,title:'EasySTEM Connector',backgroundColor:'#eff5ff',icon:iconPath,show:true,webPreferences:{preload:path.join(here,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  window.setMenuBarVisibility(false);window.loadFile(path.join(here,'ui/index.html'));window.once('ready-to-show',()=>{if(window.isMinimized())window.restore();window.show();});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',event=>event.preventDefault());
  window.on('close',event=>{if(!quitting&&tray){event.preventDefault();window.hide();}});
  ipcMain.handle('connector:status',()=>({...connector.state(),pairingCode:connector.pairing.code,origins:connector.pairing.origins,platform:process.platform,packaged:app.isPackaged,canAutoStart:app.isPackaged&&!process.env.PORTABLE_EXECUTABLE_DIR,autoStart:app.getLoginItemSettings().openAtLogin}));
  ipcMain.handle('connector:ports',()=>hardware.ports());
  ipcMain.handle('connector:revoke',async()=>{if(connector.state().busy)throw new Error('Chờ tác vụ hiện tại hoàn tất.');await hardware.disconnect();connector.pairing.reset();notify();return true;});
  ipcMain.handle('connector:open-web',()=>shell.openExternal('http://127.0.0.1:5173/#/editor'));
  ipcMain.handle('connector:autostart',(_event,value)=>{if(!app.isPackaged||process.env.PORTABLE_EXECUTABLE_DIR)throw new Error('Tự khởi động chỉ dùng cho bản đã cài đặt.');app.setLoginItemSettings({openAtLogin:value===true});return app.getLoginItemSettings().openAtLogin;});
  ipcMain.handle('connector:quit',()=>{quitting=true;app.quit();});
  const trayIcon=nativeImage.createFromPath(iconPath).resize({width:20,height:20});tray=new Tray(trayIcon);tray.setToolTip('EasySTEM Connector');
  tray.setContextMenu(Menu.buildFromTemplate([{label:'Mở EasySTEM Connector',click:()=>{window.show();window.focus();}},{label:'Thoát',click:()=>{quitting=true;app.quit();}}]));tray.on('double-click',()=>window.show());
 }).catch(error=>{dialog.showErrorBox('EasySTEM Connector',error.stack||error.message);app.quit();});
 app.on('before-quit',()=>{quitting=true;connector?.stop().catch(()=>{});});
 app.on('window-all-closed',()=>{if(!tray)app.quit();});
}
