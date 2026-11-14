import fs from 'node:fs';
// Read only known settings. Never expose this file or .env through the static server.
export function loadConfig(file){
 if(!fs.existsSync(file))return;
 for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
  const match=line.match(/^\s*(GEMINI_API_KEY|GEMINI_MODEL|APP_ORIGIN|AI_DAILY_LIMIT|PORT)\s*=\s*(.*?)\s*$/);
  if(match&&process.env[match[1]]===undefined){let value=match[2];if(/^(["']).*\1$/.test(value))value=value.slice(1,-1);process.env[match[1]]=value;}
 }
}
