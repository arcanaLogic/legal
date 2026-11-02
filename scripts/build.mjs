import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const config = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
export const labels = {
 es: {name:'Español',title:'Condiciones de Uso',legal:'Documentación legal',index:'Índice del documento',languages:'Idioma del documento',skip:'Saltar al contenido',home:'Todos los idiomas',version:'Versión candidata',updated:'Actualización del borrador',notice:'Borrador pendiente de revisión jurídica, técnica y aprobación para publicación. Los datos pendientes del titular se conservan tal como figuran en el original.',translation:'',footer:'Documento original en español. Esta página no registra aceptación ni consentimiento.',choose:'Selecciona tu idioma',intro:'Consulta las Condiciones de Uso de ArcanaLogic. Español es el documento original y la opción predeterminada.',read:'Leer en español',top:'Volver al inicio'},
 en: {name:'English',title:'Terms of Use',legal:'Legal documents',index:'Document contents',languages:'Document language',skip:'Skip to content',home:'All languages',version:'Candidate version',updated:'Draft updated',notice:'Draft pending legal and technical review and approval for publication. Outstanding owner details are retained as in the original.',translation:'Translation pending legal and linguistic review and approval.',footer:'Original document in Spanish. This page does not record acceptance or consent.',top:'Back to top'},
 pt: {name:'Português',title:'Condições de Utilização',legal:'Documentação legal',index:'Índice do documento',languages:'Idioma do documento',skip:'Saltar para o conteúdo',home:'Todos os idiomas',version:'Versão candidata',updated:'Atualização do rascunho',notice:'Rascunho pendente de revisão jurídica e técnica e de aprovação para publicação. Os dados pendentes do titular são mantidos como no original.',translation:'Tradução pendente de revisão jurídica e linguística e de aprovação.',footer:'Documento original em espanhol. Esta página não regista aceitação nem consentimento.',top:'Voltar ao início'},
 fr: {name:'Français',title:'Conditions d’utilisation',legal:'Documentation juridique',index:'Sommaire du document',languages:'Langue du document',skip:'Aller au contenu',home:'Toutes les langues',version:'Version candidate',updated:'Mise à jour du projet',notice:'Projet en attente de révision juridique et technique et d’approbation pour publication. Les coordonnées manquantes du titulaire sont conservées comme dans l’original.',translation:'Traduction en attente de révision juridique et linguistique et d’approbation.',footer:'Document original en espagnol. Cette page n’enregistre ni acceptation ni consentement.',top:'Retour en haut'},
 it: {name:'Italiano',title:'Condizioni d’uso',legal:'Documentazione legale',index:'Indice del documento',languages:'Lingua del documento',skip:'Vai al contenuto',home:'Tutte le lingue',version:'Versione candidata',updated:'Aggiornamento della bozza',notice:'Bozza in attesa di revisione giuridica e tecnica e di approvazione per la pubblicazione. I dati mancanti del titolare sono mantenuti come nell’originale.',translation:'Traduzione in attesa di revisione giuridica e linguistica e di approvazione.',footer:'Documento originale in spagnolo. Questa pagina non registra accettazione né consenso.',top:'Torna all’inizio'},
 de: {name:'Deutsch',title:'Nutzungsbedingungen',legal:'Rechtliche Dokumentation',index:'Inhaltsverzeichnis',languages:'Dokumentsprache',skip:'Zum Inhalt springen',home:'Alle Sprachen',version:'Versionsentwurf',updated:'Entwurf aktualisiert',notice:'Entwurf: Rechtliche und technische Prüfung sowie Freigabe zur Veröffentlichung stehen aus. Ausstehende Anbieterangaben werden wie im Original beibehalten.',translation:'Übersetzung: Rechtliche und sprachliche Prüfung sowie Freigabe stehen aus.',footer:'Originaldokument auf Spanisch. Diese Seite erfasst weder Zustimmung noch Einwilligung.',top:'Nach oben'}
};
export const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(text) { return escape(text.trimEnd()).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>'); }
// Intentionally small Markdown subset used by these documents. All raw HTML is
// escaped. Unsupported block syntax fails instead of silently losing content.
export function markdown(source) {
 let section=0; const toc=[];
 const html=source.trim().split(/\n\s*\n/).map(block=>{
  const lines=block.split('\n');
  const heading=block.match(/^(#{1,3}) (.+)$/u);
  if(heading) {
   const level=heading[1].length; const title=heading[2];
   const id=level===1?'document-title':level===2?(++section===18?'acceptance':`section-${section}`):`plan-${title.split(' — ')[0].toLowerCase()}`;
   if(level===2)toc.push({id,title});
   return `<h${level} id="${id}">${inline(title)}</h${level}>`;
  }
  if(block==='---')return '<hr>';
  if(lines.every(l=>l.startsWith('- ')))return '<ul>'+lines.map(l=>`<li>${inline(l.slice(2))}</li>`).join('')+'</ul>';
  if(lines.some(l=>/^(?:#{1,6} |[-*] |```|> )/.test(l)))throw Error('Unsupported Markdown block');
  return '<p>'+lines.map(inline).join('<br>')+'</p>';
 }).join('\n');
 return {html,toc};
}
const route=lang=>`${config.basePath}${lang}/terms/`;
function languages(lang) {return `<nav class="languages" aria-label="${escape(labels[lang].languages)}">${config.languages.map(code=>`<a href="${route(code)}" lang="${code}" hreflang="${code}"${code===lang?' aria-current="page"':''}>${labels[code].name}</a>`).join('')}</nav>`;}
function page(lang,title,body,canonical) {
 const l=labels[lang];
 return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="robots" content="noindex,follow"><title>${escape(title)} · ArcanaLogic</title><link rel="canonical" href="${config.origin}${canonical}">${config.languages.map(code=>`<link rel="alternate" hreflang="${code}" href="${config.origin}${route(code)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${config.origin}${config.basePath}"><link rel="stylesheet" href="${config.basePath}assets/site.css"></head>
<body id="top"><a class="skip" href="#content">${escape(l.skip)}</a><header class="masthead"><a class="brand" href="${config.basePath}">ArcanaLogic<span>${escape(l.legal)}</span></a><span class="mark" aria-hidden="true">◇</span></header>${body}<footer><a href="${config.basePath}">${escape(l.home)}</a><p>${escape(l.footer)}</p><a href="#top">${escape(l.top)}</a></footer></body></html>\n`;
}
function write(relative,content){const target=path.join(root,'dist',relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);}
export function build() {
 for(const lang of config.languages) {
  const l=labels[lang];const source=fs.readFileSync(path.join(root,'src',lang,'terms.md'),'utf8');const {html,toc}=markdown(source);
  const date=new Intl.DateTimeFormat(lang,{dateStyle:'long',timeZone:'UTC'}).format(new Date(`${config.updated}T12:00:00Z`));
  const body=`<div class="page-heading">${languages(lang)}<p class="metadata">${escape(l.version)} ${config.version} <span aria-hidden="true">·</span> ${escape(l.updated)}: <time datetime="${config.updated}">${escape(date)}</time></p><aside class="notice" role="note"><p>${escape(l.notice)}</p>${l.translation?`<p><strong>${escape(l.translation)}</strong></p>`:''}</aside></div><main id="content" class="layout"><aside class="contents"><details open><summary>${escape(l.index)}</summary><nav aria-label="${escape(l.index)}"><ol>${toc.map(t=>`<li><a href="#${t.id}">${escape(t.title)}</a></li>`).join('')}</ol></nav></details></aside><article aria-labelledby="document-title">${html}</article></main>`;
  write(`${lang}/terms/index.html`,page(lang,l.title,body,route(lang)));
 }
 const l=labels.es;
 const body=`<main id="content" class="landing"><p class="eyebrow">ARCANALOGIC / LEGAL</p><h1>${l.choose}</h1><p class="lead">${l.intro}</p><aside class="notice" role="note"><p>${l.notice}</p><p>Las traducciones están pendientes de revisión jurídica y lingüística.</p></aside><a class="primary" href="${route('es')}" lang="es">${l.read} <span aria-hidden="true">→</span></a><nav class="language-grid" aria-label="${l.languages}">${config.languages.map(code=>`<a href="${route(code)}" lang="${code}" hreflang="${code}"><span>${labels[code].name}</span><small>${labels[code].title}</small></a>`).join('')}</nav><p class="metadata">${l.version} ${config.version} · <time datetime="${config.updated}">${config.updated}</time></p></main>`;
 write('index.html',page('es',l.legal,body,config.basePath));
 write('assets/site.css',fs.readFileSync(path.join(root,'src','site.css'),'utf8'));
 write('.nojekyll','');
 console.log('Built 6 terms pages and language selection under /legal/.');
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))build();
