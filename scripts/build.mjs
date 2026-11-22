import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const config = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
export const labels = {
 es: {name:'Español',title:'Condiciones de Uso',legal:'Documentación legal',index:'Índice del documento',languages:'Idioma del documento',skip:'Saltar al contenido',home:'Todos los idiomas',version:'Versión candidata',updated:'Actualización del borrador',translation:'',footer:'Documento original en español. Esta página no registra aceptación ni consentimiento.',choose:'Selecciona tu idioma',top:'Volver al inicio'},
 en: {name:'English',title:'Terms of Use',legal:'Legal documents',index:'Document contents',languages:'Document language',skip:'Skip to content',home:'All languages',version:'Candidate version',updated:'Draft updated',translation:'Translation pending legal and linguistic review and approval.',footer:'Original document in Spanish. This page does not record acceptance or consent.',top:'Back to top'},
 pt: {name:'Português',title:'Condições de Utilização',legal:'Documentação legal',index:'Índice do documento',languages:'Idioma do documento',skip:'Saltar para o conteúdo',home:'Todos os idiomas',version:'Versão candidata',updated:'Atualização do rascunho',translation:'Tradução pendente de revisão jurídica e linguística e de aprovação.',footer:'Documento original em espanhol. Esta página não regista aceitação nem consentimento.',top:'Voltar ao início'},
 fr: {name:'Français',title:'Conditions d’utilisation',legal:'Documentation juridique',index:'Sommaire du document',languages:'Langue du document',skip:'Aller au contenu',home:'Toutes les langues',version:'Version candidate',updated:'Mise à jour du projet',translation:'Traduction en attente de révision juridique et linguistique et d’approbation.',footer:'Document original en espagnol. Cette page n’enregistre ni acceptation ni consentement.',top:'Retour en haut'},
 it: {name:'Italiano',title:'Condizioni d’uso',legal:'Documentazione legale',index:'Indice del documento',languages:'Lingua del documento',skip:'Vai al contenuto',home:'Tutte le lingue',version:'Versione candidata',updated:'Aggiornamento della bozza',translation:'Traduzione in attesa di revisione giuridica e linguistica e di approvazione.',footer:'Documento originale in spagnolo. Questa pagina non registra accettazione né consenso.',top:'Torna all’inizio'},
 de: {name:'Deutsch',title:'Nutzungsbedingungen',legal:'Rechtliche Dokumentation',index:'Inhaltsverzeichnis',languages:'Dokumentsprache',skip:'Zum Inhalt springen',home:'Alle Sprachen',version:'Versionsentwurf',updated:'Entwurf aktualisiert',translation:'Übersetzung: Rechtliche und sprachliche Prüfung sowie Freigabe stehen aus.',footer:'Originaldokument auf Spanisch. Diese Seite erfasst weder Zustimmung noch Einwilligung.',top:'Nach oben'}
};
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const translations = Object.fromEntries(config.languages.map(lang => [lang, readJson(`src/i18n/${lang}.json`)]));
export const siteVariables = Object.freeze(readJson('site.variables.json'));
const emailPattern = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const keyPattern = /^[A-Za-z][A-Za-z0-9]*$/;
const legacyPlaceholder = /\[\s*[^\]\n]*(?:pendient|pendent|pending|en attente|in attesa|ausstehend|à déterminer|da determinare|zu klären)[^\]\n]*\]/iu;

function variableValue(key, variables) {
 if (!keyPattern.test(key) || !Object.hasOwn(variables, key)) {
  throw Error(`Unknown document variable: ${key}`);
 }
 const value = variables[key];
 if (value === null) return null;
 if (typeof value !== 'string' || !value.trim() || /[\r\n]|\{\{|\}\}/.test(value) || legacyPlaceholder.test(value)) {
  throw Error(`Invalid document variable: ${key}`);
 }
 if (key.endsWith('Email') && !emailPattern.test(value)) {
  throw Error(`Invalid email variable: ${key}`);
 }
 return value;
}

function requiredValue(key, variables) {
 const value = variableValue(key, variables);
 if (value === null) throw Error(`Required document variable is pending: ${key}`);
 return value;
}

for (const key of Object.keys(siteVariables)) variableValue(key, siteVariables);

export function assertNoPlaceholders(text) {
 if (/\{\{|\}\}/.test(text)) throw Error('Unresolved document variable');
 if (legacyPlaceholder.test(text)) throw Error('Legacy pending placeholder');
}

export function sectionsFor(preview) {
 return Object.entries(config.documents).filter(([section, {status}]) => {
  if (!/^[a-z][a-z0-9-]*$/.test(section) || !['draft', 'review', 'approved'].includes(status)) {
   throw Error(`Invalid document configuration: ${section}`);
  }
  if (status === 'approved' && config.accountDeletionVerified !== true) {
   throw Error(`Account deletion readiness must be verified before approving ${section}`);
  }
  return preview || status !== 'draft';
 }).map(([section]) => section);
}

export function outputDirectory(preview) {
 return preview ? 'dist-preview' : 'dist';
}

export const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(text, {variables = siteVariables, emailLink = false, omitOptional = false} = {}) {
 const html = escape(text.trimEnd()).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
 const rendered = html.replace(/\{\{(\??)([A-Za-z][A-Za-z0-9]*)\}\}/g, (_, optional, key) => {
  if (optional && !omitOptional) throw Error('Optional variables must end a list item');
  const value = escape(requiredValue(key, variables));
  if (emailLink && key === 'accountDeletionEmail') return `<a href="mailto:${value}">${value}</a>`;
  return value;
 });
 assertNoPlaceholders(rendered);
 return rendered;
}

function listItem(line, options) {
 const optional = line.match(/\{\{\?([A-Za-z][A-Za-z0-9]*)\}\}$/);
 if (optional && variableValue(optional[1], options.variables ?? siteVariables) === null) {
  // Check the rest of the line even when this item is omitted.
  inline(line.slice(2, optional.index), options);
  return '';
 }
 return `<li>${inline(line.slice(2), {...options, omitOptional: Boolean(optional)})}</li>`;
}

export function renderDocument(source, section, variables = siteVariables) {
 const {status, requiredVariables = []} = config.documents[section];
 for (const key of requiredVariables) requiredValue(key, variables);
 return markdown(source, {legacyAnchors: section === 'terms', variables, emailLink: status === 'approved'});
}

// Intentionally small Markdown subset used by these documents. All raw HTML is
// escaped. Unsupported block syntax fails instead of silently losing content.
export function markdown(source, options = {}) {
 let section=0; let subsection=0; const toc=[];
 const html=source.trim().split(/\n\s*\n/).map(block=>{
  const lines=block.split('\n');
  const heading=block.match(/^(#{1,3}) (.+)$/u);
  if(heading) {
   const level=heading[1].length; const title=heading[2];
   const id=level===1?'document-title':level===2?(++section===18&&options.legacyAnchors?'acceptance':`section-${section}`):options.legacyAnchors?`plan-${title.split(' — ')[0].toLowerCase()}`:`subsection-${++subsection}`;
   if(level===2)toc.push({id,title: inline(title, {...options, emailLink: false})});
   return `<h${level} id="${id}">${inline(title, options)}</h${level}>`;
  }
  if(block==='---')return '<hr>';
  // Plan names can introduce a list without a blank line.
  const listLabel = lines.length > 1 && /^\*\*[^*]+\*\*$/.test(lines[0]);
  const listLines = listLabel ? lines.slice(1) : lines;
  if (listLines.every(line => line.startsWith('- '))) {
   const items = listLines.map(line => listItem(line, options)).join('');
   const label = listLabel ? `<p>${inline(lines[0], options)}</p>` : '';
   return label + (items ? '<ul>' + items + '</ul>' : '');
  }
  if(lines.some(l=>/^(?:#{1,6} |[-*] |```|> )/.test(l)))throw Error('Unsupported Markdown block');
  return '<p>'+lines.map(line => inline(line, options)).join('<br>')+'</p>';
 }).join('\n');
 return {html,toc};
}
const route=(lang, section = 'terms')=>`${config.basePath}${lang}/${section}/`;
function languages(lang, section = 'terms') {return `<nav class="languages language-selector" aria-label="${escape(labels[lang].languages)}">${config.languages.map(code=>`<a href="${route(code, section)}" lang="${code}" hreflang="${code}"${code===lang?' aria-current="page"':''}>${labels[code].name}</a>`).join('')}</nav>`;}
function page(lang,title,body,canonical,section) {
 const l=labels[lang];
 const alternates = section ? config.languages.map(code =>
  `<link rel="alternate" hreflang="${code}" href="${config.origin}${route(code, section)}">`
 ).join('') + `<link rel="alternate" hreflang="x-default" href="${config.origin}${section === 'terms' ? config.basePath : route('es', section)}">` : '';
 return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="robots" content="noindex,follow"><title>${escape(title)} · ArcanaLogic</title><link rel="canonical" href="${config.origin}${canonical}">${alternates}<link rel="stylesheet" href="${config.basePath}assets/site.css"></head>
<body id="top"><a class="skip" href="#content">${escape(l.skip)}</a><header class="masthead"><a class="brand" href="${config.basePath}">ArcanaLogic<span>${escape(l.legal)}</span></a><span class="mark" aria-hidden="true">◇</span></header>${body}<footer><a href="${config.basePath}">${escape(l.home)}</a><p>${escape(l.footer)}</p><a href="#top">${escape(l.top)}</a></footer></body></html>\n`;
}
function documentTitle(lang, section) {
 if (section === 'terms') return labels[lang].title;
 const title = translations[lang]?.titles[section];
 if (typeof title !== 'string' || !title.trim()) throw Error(`Missing title: ${lang}/${section}`);
 return title;
}

function documentLinks(lang, section, sections) {
 if (sections.length === 1) return '';
 return `<nav class="languages section-selector" aria-label="${escape(translations[lang].documents)}">${sections.map(code =>
  `<a href="${route(lang, code)}"${code === section ? ' aria-current="page"' : ''}>${escape(documentTitle(lang, code))}</a>`
 ).join('')}</nav>`;
}

function editorialNotice(lang, section) {
 const {status} = config.documents[section];
 if (status === 'approved') return '';
 const translation = labels[lang].translation;
 return `<aside class="notice" role="note"><p>${escape(translations[lang][status])}</p>${translation ? `<p>${escape(translation)}</p>` : ''}</aside>`;
}

export function build({preview = false, variables = siteVariables} = {}) {
 const sections = sectionsFor(preview);
 const output = path.join(root, outputDirectory(preview));
 const files = new Map();
 const write = (relative, content) => files.set(relative, content);
 for(const lang of config.languages) {
  const l=labels[lang];
  if (sections.includes('terms')) {
   const source=fs.readFileSync(path.join(root,'src',lang,'terms.md'),'utf8');const {html,toc}=renderDocument(source, 'terms', variables);
   const date=new Intl.DateTimeFormat(lang,{dateStyle:'long',timeZone:'UTC'}).format(new Date(`${config.updated}T12:00:00Z`));
   const body=`<div class="page-heading">${languages(lang)}${documentLinks(lang, 'terms', sections)}<p class="metadata">${escape(l.version)} ${config.version} <span aria-hidden="true">·</span> ${escape(l.updated)}: <time datetime="${config.updated}">${escape(date)}</time></p>${editorialNotice(lang, 'terms')}</div><main id="content" class="layout"><aside class="contents"><details open><summary>${escape(l.index)}</summary><nav aria-label="${escape(l.index)}"><ol>${toc.map(t=>`<li><a href="#${t.id}">${t.title}</a></li>`).join('')}</ol></nav></details></aside><article aria-labelledby="document-title">${html}</article></main>`;
   write(`${lang}/terms/index.html`,page(lang,l.title,body,route(lang), 'terms'));
  }
  for (const section of sections.filter(code => code !== 'terms')) {
   const source = fs.readFileSync(path.join(root, 'src', lang, `${section}.md`), 'utf8');
   const { html } = renderDocument(source, section, variables);
   const body = `<div class="page-heading">${languages(lang, section)}${documentLinks(lang, section, sections)}${editorialNotice(lang, section)}</div><main id="content" class="page-heading"><article aria-labelledby="document-title">${html}</article></main>`;
   write(`${lang}/${section}/index.html`, page(lang, documentTitle(lang, section), body, route(lang, section), section));
  }
 }
 const l=labels.es;
 const languagePicker = `<nav class="languages" aria-label="${l.languages}">${config.languages.map(code =>
  `<a href="#language-${code}" lang="${code}">${labels[code].name}</a>`
 ).join('')}</nav>`;
 const languageCards = config.languages.map(code => `
  <section class="language-card" id="language-${code}" lang="${code}" aria-labelledby="language-title-${code}">
   <h2 id="language-title-${code}">${labels[code].name}</h2>
   <ul>${sections.map(section =>
    `<li><a href="${route(code, section)}" hreflang="${code}">${escape(documentTitle(code, section))}</a></li>`
   ).join('')}</ul>
  </section>`).join('');
 const body = `<main id="content" class="landing"><h1>${l.choose}</h1>${languagePicker}<div class="language-grid">${languageCards}</div></main>`;
 write('index.html',page('es',l.legal,body,config.basePath));
 write('assets/site.css',fs.readFileSync(path.join(root,'src','site.css'),'utf8'));
 write('.nojekyll','');
 // Clear only the selected, generated output once all documents have rendered.
 fs.rmSync(output, {recursive: true, force: true});
 for (const [relative, content] of files) {
  const target = path.join(output, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, content);
 }
 console.log(`Built ${config.languages.length * sections.length} document pages in ${outputDirectory(preview)}.`);
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))build({preview: process.argv.includes('--preview')});
