import { registerBlocks,refreshDeviceFields } from './blocks.js';
import { toolbox,initialWorkspace } from './toolbox.js';
import { generateArduino } from './arduino-generator.js';
export function createWorkspace(Blockly,container,devices,onChange) {
 registerBlocks(Blockly);
 container.replaceChildren();
 const theme=Blockly.Theme.defineTheme('easystem',{base:Blockly.Themes.Classic,fontStyle:{family:'Segoe UI, sans-serif',weight:'600',size:11},componentStyles:{workspaceBackgroundColour:'#fcfdff',toolboxBackgroundColour:'#f7faff',toolboxForegroundColour:'#203454',flyoutBackgroundColour:'#eef3ff',flyoutForegroundColour:'#203454',flyoutOpacity:.98,scrollbarColour:'#c7d5ed',scrollbarOpacity:.7,insertionMarkerColour:'#8b59ef',insertionMarkerOpacity:.4}});
 const workspace=Blockly.inject(container,{toolbox,theme,renderer:'zelos',media:'/vendor/blockly/media/',sounds:false,trashcan:true,grid:{spacing:22,length:2,colour:'#d9e4f8',snap:true},move:{scrollbars:true,drag:true,wheel:true},zoom:{controls:false,wheel:true,startScale:.85,maxScale:1.6,minScale:.4,scaleSpeed:1.1},maxBlocks:300,maxInstances:{es_start:1,es_forever:1},comments:true,collapse:true,disable:true});
 workspace.stemDevices=devices;
 let suspended=false,disposed=false,warningCache=new Map();
 function load(state,nextDevices=devices) {
  suspended=true;Blockly.Events.disable();
  try {workspace.stemDevices=nextDevices;Blockly.serialization.workspaces.load(state,workspace);workspace.clearUndo();warningCache.clear();}
  finally{Blockly.Events.enable();suspended=false;}
  Blockly.svgResize(workspace);
 }
 load(initialWorkspace,devices);
 const observer=new ResizeObserver(()=>{if(!disposed)Blockly.svgResize(workspace);});observer.observe(container);
 workspace.addChangeListener(event=>{
  if(suspended||disposed)return;
  if(event.isUiEvent){if(event.type===Blockly.Events.VIEWPORT_CHANGE)onChange({ui:true});return;}
  if(event.type===Blockly.Events.FINISHED_LOADING)return;
  onChange({group:event.group||null});
 });
 return {
  workspace,
  save:()=>Blockly.serialization.workspaces.save(workspace),
  load,
  setDevices(next){devices=next;refreshDeviceFields(Blockly,workspace,next);},
  generate(){
   const result=generateArduino(workspace,devices);const messages=new Map();
   for(const issue of result.errors){if(issue.blockId)messages.set(issue.blockId,[messages.get(issue.blockId),issue.message].filter(Boolean).join('\n'));}
   for(const b of workspace.getAllBlocks(false)){const message=messages.get(b.id)||null;if(warningCache.get(b.id)!==message)b.setWarningText(message,'stem-validation');warningCache.set(b.id,message);}
   return result;
  },
  resize:()=>Blockly.svgResize(workspace),
  dispose(){disposed=true;observer.disconnect();workspace.dispose();}
 };
}
