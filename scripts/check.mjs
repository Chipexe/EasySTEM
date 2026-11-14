import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../',import.meta.url));
function files(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]); }
const source=files(path.join(root,'src'));
let count=0;
for (const file of source.filter(f=>f.endsWith('.js'))) {
 const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
 if(result.status!==0) { console.error(result.stderr); process.exit(1); }
 const text=fs.readFileSync(file,'utf8');
 for(const match of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
  if(match[1].startsWith('.')) assert.ok(fs.existsSync(path.resolve(path.dirname(file),match[1])),`Missing import: ${file}: ${match[1]}`);
 }
 count++;
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const match of html.matchAll(/(?:href|src)="(\/[^\"]+)"/g)) assert.ok(fs.existsSync(path.join(root,match[1])),`Missing HTML asset: ${match[1]}`);
const { assets }=await import('../src/components/ui.js');
for(const asset of Object.values(assets)) assert.ok(fs.existsSync(path.join(root,asset)),`Missing image: ${asset}`);
const { lessons }=await import('../src/pages/library/library.data.js');
assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length,'Duplicate lesson IDs');
const { competitions }=await import('../src/pages/competitions/competitions.data.js');
assert.ok(competitions.every(c=>['ongoing','upcoming','ended'].includes(c.status)));
console.log(`PASS: ${count} JavaScript modules, imports, stylesheets, reference images, and sample data.`);
