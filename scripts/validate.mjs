import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { root, config, labels, renderDocument, siteVariables, sectionsFor, outputDirectory, assertNoPlaceholders, escape } from './build.mjs';
const preview = process.argv.includes('--preview');
const output = outputDirectory(preview);
const sections = sectionsFor(preview);
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
const spanish=read('src/es/terms.md');
assert.equal(hash(spanish),config.termsTemplateSha256,'Spanish terms must match the reviewed template digest');
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
const home = read(`${output}/index.html`);
const i18n = lang => JSON.parse(read(`src/i18n/${lang}.json`));
const titles = lang => ({terms: labels[lang].title, ...i18n(lang).titles});
const route = (lang, section) => `${config.basePath}${lang}/${section}/`;
const documentBody = page => page.match(/<article aria-labelledby="document-title">([\s\S]*?)<\/article>/)?.[1];
const navigation = (page, name) => page.match(new RegExp(`<nav class="languages ${name}"[^>]*>(.*?)</nav>`, 's'))?.[1] ?? '';
const hrefs = html => Array.from(html.matchAll(/href="([^"]+)"/g), match => match[1]);

function validateNavigation(page, lang, section) {
 const languages = navigation(page, 'language-selector');
 const documents = navigation(page, 'section-selector');
 assert.deepEqual(hrefs(languages), config.languages.map(code => route(code, section)), `${lang}/${section}: language changes must preserve the section`);
 assert(languages.includes(`href="${route(lang, section)}" lang="${lang}" hreflang="${lang}" aria-current="page"`));
 assert.deepEqual(hrefs(documents), sections.length > 1 ? sections.map(code => route(lang, code)) : [], `${lang}/${section}: wrong section menu`);
 if (sections.length > 1) {
  for (const code of sections) {
   const current = code === section ? ' aria-current="page"' : '';
   assert(documents.includes(`href="${route(lang, code)}"${current}>${escape(titles(lang)[code])}</a>`));
  }
 }
 assert(page.includes(`<a class="brand" href="${config.basePath}"`), `${lang}/${section}: missing home link`);
}
for(const lang of config.languages) {
 const card = home.match(new RegExp(`<section class="language-card" id="language-${lang}" lang="${lang}"[^>]*>(.*?)</section>`, 's'))?.[1];
 assert(card, `Missing home language card: ${lang}`);
 assert(home.includes(`href="#language-${lang}" lang="${lang}"`));
 assert.deepEqual(hrefs(card), sections.map(code => route(lang, code)), `Incomplete home menu: ${lang}`);
 for (const code of sections) {
  assert(card.includes(`href="${route(lang, code)}" hreflang="${lang}">${escape(titles(lang)[code])}</a>`));
 }
 const text=read(`src/${lang}/terms.md`);
 const numberedSections=[...text.matchAll(/^## (\d+)\./gm)].map(m=>Number(m[1]));
 assert.deepEqual(numberedSections,Array.from({length:17},(_,i)=>i+1),`${lang}: 17 ordered sections`);
 assert.equal((text.match(/^## /gm)||[]).length,18,`${lang}: acceptance must be present`);
 assert.equal(blocks(text).length,blocks(spanish).length,`${lang}: complete block structure`);
 assert.deepEqual(blocks(text).map(b=>b.startsWith('- ')?bullets(b).length:0),blocks(spanish).map(b=>b.startsWith('- ')?bullets(b).length:0),`${lang}: no missing list items`);
 assert.deepEqual(numbers(text),numbers(spanish),`${lang}: numbers/prices/version/age/sections must not change`);
 for(const sentence of signatures[lang])assert(text.includes(sentence),`${lang}: commercial quota changed`);
 const plans=[...text.matchAll(/^### (.+)$/gm)].map(m=>m[1]);
 assert.equal(plans.length,3);assert(plans[0].startsWith('Basic — '));assert(plans[1].startsWith('Premium — 3,95 € '));assert(plans[2].startsWith('VIP — 4,95 € '));
 assert(text.includes('Rider-Waite-Smith')&&text.includes('(RWS)'),`${lang}: technical system reference`);
 assert.deepEqual(text.match(/\{\{[^{}]+\}\}/g), spanish.match(/\{\{[^{}]+\}\}/g), `${lang}: terms variable references differ from Spanish`);
 assert(!/artificial intelligence|inteligencia artificial|intelligence artificielle|intelligenza artificiale|inteligência artificial|künstliche intelligenz/i.test(text));
 const parsed=renderDocument(text, 'terms');assert.equal(parsed.toc.length,18);
 for (const section of Object.keys(config.documents)) {
  const file = `${lang}/${section}/index.html`;
  const source = section === 'terms' ? text : read(`src/${lang}/${section}.md`);
  const {html: rendered} = section === 'terms' ? parsed : renderDocument(source, section);
  if (!sections.includes(section)) continue;
  const page = read(`${output}/${file}`);
  const {status} = config.documents[section];
  assert(preview || status !== 'draft', `${file}: draft content in publishing output`);
  assert.equal(documentBody(page), rendered, `${file}: rendered document does not match generated page`);
  validateNavigation(page, lang, section);
  assert(page.includes(`<html lang="${lang}">`));
  assert.equal((page.match(/<h1\b/g) || []).length, 1);
  assert.equal(page.includes('role="note"'), status !== 'approved');
  if (status !== 'approved') {
   assert(page.includes(escape(i18n(lang)[status])), `${file}: missing editorial notice`);
   if (lang !== 'es') assert(page.includes(escape(labels[lang].translation)));
   assert(!page.includes('href="mailto:'), `${file}: unapproved contact link`);
  }
  if (section === 'terms') assert(page.includes('id="acceptance"'));
  if (['privacy', 'faq', 'delete-account'].includes(section)) assert(/\b48\b/.test(source), `${file}: missing 48-hour deadline`);
  for (const code of config.languages) {
   assert(page.includes(`hreflang="${code}" href="${config.origin}${config.basePath}${code}/${section}/"`));
  }
  assert(page.includes(`rel="canonical" href="${config.origin}${config.basePath}${lang}/${section}/"`));
  generated.push(file);
 }
}
generated.push('index.html','assets/site.css','.nojekyll');
const voidTags=new Set(['meta','link','br','hr']);
for(const file of generated.filter(f=>f.endsWith('.html'))) {
 const html=read(output+'/'+file);const stack=[];
 assertNoPlaceholders(html);
 for(const match of html.matchAll(/<(\/?)([a-z][a-z0-9-]*)\b[^>]*>/g)) {
  const [,closing,tag]=match;if(voidTags.has(tag))continue;
  if(closing)assert.equal(stack.pop(),tag,`${file}: unbalanced HTML`);else stack.push(tag);
 }
 assert.equal(stack.length,0,`${file}: unclosed HTML`);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,`${file}: duplicate IDs`);
 assert(html.includes('name="viewport"'));assert(!/<script\b|<iframe\b|\bonclick=|\bping=/i.test(html));
 for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  if (match[1].startsWith('mailto:')) {
   assert.equal(match[1], `mailto:${siteVariables.accountDeletionEmail}`);
   assert.equal(config.accountDeletionVerified, true);
   continue;
  }
  const url=new URL(match[1],config.origin+config.basePath+file.replace(/index\.html$/,''));
  assert.equal(url.origin,config.origin,`${file}: unexpected external resource`);
  assert(url.pathname.startsWith(config.basePath),`${file}: link escaped /legal/`);
  const relative=decodeURIComponent(url.pathname.slice(config.basePath.length));
  const target=relative===''?'index.html':relative.endsWith('/')?relative+'index.html':relative;
  assert(fs.existsSync(path.join(root,output,target)),`${file}: broken link ${match[1]}`);
  if(url.hash)assert(read(output+'/'+target).includes(`id="${url.hash.slice(1)}"`),`${file}: missing fragment`);
 }
}
function walk(dir,prefix='') {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{assert(!entry.isSymbolicLink(),'Symlinks forbidden');const name=prefix+entry.name;return entry.isDirectory()?walk(path.join(dir,entry.name),name+'/'):[name];});}
assert.deepEqual(walk(path.join(root,output)).sort(),generated.sort(),'Only approved static output may be published');
assert(read(output+'/assets/site.css').includes('@media(max-width:760px)'));
assert(read(output+'/assets/site.css').includes(':focus-visible'));
assert(!read(output+'/assets/site.css').includes('@import'));
for(const file of walk(root).filter(f=>!f.startsWith('.git/'))) {
 const text=read(file);
 assert(!/(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(text),`Secret pattern in ${file}`);
 assert(!/credentials\/|github\.com_Credentials\.txt/.test(text),`Private input path in ${file}`);
}
console.log(`PASS: ${generated.length - 2} HTML pages in ${output}, historical terms, localized routes, variables, internal links, fragments and artifact contents.`);
console.log('Pending: human legal/linguistic approval, visual mobile/browser review and real GitHub Pages HTTP validation.');
