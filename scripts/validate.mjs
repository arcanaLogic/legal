import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { root, config, labels, markdown } from './build.mjs';
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
const spanish=read('src/es/terms.md');
assert.equal(hash(spanish),config.sourceSha256,'Spanish must match the original reference digest');
const original=path.resolve(root,'../base_terms.md');
if(fs.existsSync(original))assert.equal(hash(fs.readFileSync(original)),config.sourceSha256,'Do not modify base_terms.md');
const blocks=text=>text.trim().split(/\n\s*\n/);
const numbers=text=>text.match(/\d+(?:[.,]\d+)?/g);
const bullets=text=>text.split('\n').filter(l=>l.startsWith('- '));
const signatures = {
 es:['Una tirada de tarot al mes.','Una consulta de Sí/No al mes.','Una tirada de tarot por semana.','Tres consultas de Sí/No por semana.','Dos tiradas de tarot por semana.','Una consulta de Sí/No al día.','tres anuncios recompensados por consulta adicional.','dos anuncios recompensados por consulta adicional.'],
 en:['One tarot spread per month.','One Yes/No question per month.','One tarot spread per week.','Three Yes/No questions per week.','Two tarot spreads per week.','One Yes/No question per day.','three rewarded ads per additional consultation.','two rewarded ads per additional consultation.'],
 pt:['Uma tiragem de tarot por mês.','Uma consulta de Sim/Não por mês.','Uma tiragem de tarot por semana.','Três consultas de Sim/Não por semana.','Duas tiragens de tarot por semana.','Uma consulta de Sim/Não por dia.','três anúncios recompensados por consulta adicional.','dois anúncios recompensados por consulta adicional.'],
 fr:['Un tirage de tarot par mois.','Une consultation Oui/Non par mois.','Un tirage de tarot par semaine.','Trois consultations Oui/Non par semaine.','Deux tirages de tarot par semaine.','Une consultation Oui/Non par jour.','trois publicités récompensées par consultation supplémentaire.','deux publicités récompensées par consultation supplémentaire.'],
 it:['Una stesa di tarocchi al mese.','Un consulto Sì/No al mese.','Una stesa di tarocchi alla settimana.','Tre consulti Sì/No alla settimana.','Due stese di tarocchi alla settimana.','Un consulto Sì/No al giorno.','tre annunci con ricompensa per consulto aggiuntivo.','due annunci con ricompensa per consulto aggiuntivo.'],
 de:['Eine Tarot-Legung pro Monat.','Eine Ja/Nein-Befragung pro Monat.','Eine Tarot-Legung pro Woche.','Drei Ja/Nein-Befragungen pro Woche.','Zwei Tarot-Legungen pro Woche.','Eine Ja/Nein-Befragung pro Tag.','drei belohnte Werbeanzeigen pro zusätzlicher Befragung.','zwei belohnte Werbeanzeigen pro zusätzlicher Befragung.']
};
const generated=[];
for(const lang of config.languages) {
 const text=read(`src/${lang}/terms.md`);
 const sections=[...text.matchAll(/^## (\d+)\./gm)].map(m=>Number(m[1]));
 assert.deepEqual(sections,Array.from({length:17},(_,i)=>i+1),`${lang}: 17 ordered sections`);
 assert.equal((text.match(/^## /gm)||[]).length,18,`${lang}: acceptance must be present`);
 assert.equal(blocks(text).length,blocks(spanish).length,`${lang}: complete block structure`);
 assert.deepEqual(blocks(text).map(b=>b.startsWith('- ')?bullets(b).length:0),blocks(spanish).map(b=>b.startsWith('- ')?bullets(b).length:0),`${lang}: no missing list items`);
 assert.deepEqual(numbers(text),numbers(spanish),`${lang}: numbers/prices/version/age/sections must not change`);
 for(const sentence of signatures[lang])assert(text.includes(sentence),`${lang}: commercial quota changed`);
 const plans=[...text.matchAll(/^### (.+)$/gm)].map(m=>m[1]);
 assert.equal(plans.length,3);assert(plans[0].startsWith('Basic — '));assert(plans[1].startsWith('Premium — 3,95 € '));assert(plans[2].startsWith('VIP — 4,95 € '));
 assert(text.includes('Rider-Waite-Smith')&&text.includes('(RWS)'),`${lang}: technical system reference`);
 assert.equal((text.match(/\[[^\]\n]+\]/g)||[]).length,(spanish.match(/\[[^\]\n]+\]/g)||[]).length,`${lang}: preserve unresolved owner fields`);
 assert(!/artificial intelligence|inteligencia artificial|intelligence artificielle|intelligenza artificiale|inteligência artificial|künstliche intelligenz/i.test(text));
 const parsed=markdown(text);assert.equal(parsed.toc.length,18);
 const html=read(`dist/${lang}/terms/index.html`);
 assert(html.includes(`<html lang="${lang}">`));assert(html.includes(parsed.html));
 assert(html.includes('id="acceptance"'));assert.equal((html.match(/<h1\b/g)||[]).length,1);
 if(lang!=='es')assert(html.includes(labels[lang].translation));
 generated.push(`${lang}/terms/index.html`);
}
generated.push('index.html','assets/site.css','.nojekyll');
const voidTags=new Set(['meta','link','br','hr']);
for(const file of generated.filter(f=>f.endsWith('.html'))) {
 const html=read('dist/'+file);const stack=[];
 for(const match of html.matchAll(/<(\/?)([a-z][a-z0-9-]*)\b[^>]*>/g)) {
  const [,closing,tag]=match;if(voidTags.has(tag))continue;
  if(closing)assert.equal(stack.pop(),tag,`${file}: unbalanced HTML`);else stack.push(tag);
 }
 assert.equal(stack.length,0,`${file}: unclosed HTML`);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,`${file}: duplicate IDs`);
 assert(html.includes('name="viewport"'));assert(!/<script\b|<iframe\b|\bonclick=|\bping=/i.test(html));
 for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  const url=new URL(match[1],config.origin+config.basePath+file.replace(/index\.html$/,''));
  assert.equal(url.origin,config.origin,`${file}: unexpected external resource`);
  assert(url.pathname.startsWith(config.basePath),`${file}: link escaped /legal/`);
  const relative=decodeURIComponent(url.pathname.slice(config.basePath.length));
  const target=relative===''?'index.html':relative.endsWith('/')?relative+'index.html':relative;
  assert(fs.existsSync(path.join(root,'dist',target)),`${file}: broken link ${match[1]}`);
  if(url.hash)assert(read('dist/'+target).includes(`id="${url.hash.slice(1)}"`),`${file}: missing fragment`);
 }
}
function walk(dir,prefix='') {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{assert(!entry.isSymbolicLink(),'Symlinks forbidden');const name=prefix+entry.name;return entry.isDirectory()?walk(path.join(dir,entry.name),name+'/'):[name];});}
assert.deepEqual(walk(path.join(root,'dist')).sort(),generated.sort(),'Only approved static output may be published');
assert(read('dist/index.html').includes('href="/legal/es/terms/"'));
assert(read('dist/assets/site.css').includes('@media(max-width:760px)'));
assert(read('dist/assets/site.css').includes(':focus-visible'));
assert(!read('dist/assets/site.css').includes('@import'));
for(const file of walk(root).filter(f=>!f.startsWith('.git/'))) {
 const text=read(file);
 assert(!/(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(text),`Secret pattern in ${file}`);
 assert(!/credentials\/|github\.com_Credentials\.txt/.test(text),`Private input path in ${file}`);
}
console.log('PASS: 6 complete documents, 17 sections + acceptance, 95 blocks each, commercial quotas/prices, original hash, 7 HTML pages, all /legal/ links/fragments/resources, semantic tag balance, review labels and secret-pattern checks.');
console.log('Pending: human legal/linguistic approval, visual mobile/browser review and real GitHub Pages HTTP validation.');
