const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('connector',{
 status:()=>ipcRenderer.invoke('connector:status'),ports:()=>ipcRenderer.invoke('connector:ports'),
 revoke:()=>ipcRenderer.invoke('connector:revoke'),openWeb:()=>ipcRenderer.invoke('connector:open-web'),
 autoStart:value=>ipcRenderer.invoke('connector:autostart',value),quit:()=>ipcRenderer.invoke('connector:quit'),
 onChanged:callback=>{const listener=()=>callback();ipcRenderer.on('connector:changed',listener);return ()=>ipcRenderer.removeListener('connector:changed',listener);}
});
