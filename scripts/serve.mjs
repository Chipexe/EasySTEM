import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../server/config.mjs';
import { createAssistantHandler } from '../server/assistant/http.mjs';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
export function createAppServer(options={}) {
const assistant=createAssistantHandler(options);
return http.createServer(async(req, res) => {
  try {
  if(await assistant(req,res))return;
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  let relative;
  try { relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  if (relative.includes('\0')||relative.includes('\\')||relative.split('/').some(p=>p.startsWith('.')&&p.length)) { res.writeHead(403).end(); return; }
  if(!['/','/index.html'].includes(relative)&&!/^\/(src\/|Giaodien\/|vendor\/blockly\/)/.test(relative)){res.writeHead(404).end();return;}
  const target = path.resolve(root, '.' + relative);
  if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  let file = relative === '/' ? path.join(root, 'index.html') : target;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end('Not found'); return; }
  if(!fs.realpathSync(file).startsWith(fs.realpathSync(root)+path.sep)){res.writeHead(403).end();return;}
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options':'nosniff' });
  if(req.method==='HEAD')res.end();else fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  } catch { if(!res.headersSent)res.writeHead(500);res.end(); }
});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
loadConfig(path.join(root,'.env'));
const server=createAppServer();server.requestTimeout=70000;server.headersTimeout=10000;
server.listen(Number(process.env.PORT || 5173), '127.0.0.1', () => console.log(`EasySTEM: http://127.0.0.1:${server.address().port}`));
}
