import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, build, markdown } from './build.mjs';
function snapshot(dir,prefix='') {
 return fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>e.isDirectory()?snapshot(path.join(dir,e.name),prefix+e.name+'/'):[[prefix+e.name,crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,e.name))).digest('hex')]]);
}
const before=snapshot(path.join(root,'dist'));build();
assert.deepEqual(snapshot(path.join(root,'dist')),before,'Repeated builds must be byte-identical');
assert(markdown('# Title\n\n## 1. Section\n\n<script>alert(1)</script>').html.includes('&lt;script&gt;'));
assert(!markdown('# Title\n\n<script>alert(1)</script>').html.includes('<script>'));
assert.throws(()=>markdown('> unsupported block'),'Unsupported Markdown must not silently lose content');
console.log('PASS: deterministic repeated build, HTML escaping, unsupported block rejection.');
