import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, build, markdown, outputDirectory, sectionsFor, config, siteVariables, escape, renderDocument } from './build.mjs';
function snapshot(dir,prefix='') {
 return fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>e.isDirectory()?snapshot(path.join(dir,e.name),prefix+e.name+'/'):[[prefix+e.name,crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,e.name))).digest('hex')]]);
}
const preview = process.argv.includes('--preview');
const output = path.join(root, outputDirectory(preview));
const before = snapshot(output);
build({preview});
assert.deepEqual(snapshot(output), before, 'Repeated clean builds must be byte-identical');
assert.throws(() => markdown('{{unknown}}'), /Unknown document variable/);
const emailMarker = '**{{accountDeletionEmail}}**';
assert.equal(markdown(emailMarker).html, `<p><strong>${siteVariables.accountDeletionEmail}</strong></p>`);
assert.equal(
 markdown(emailMarker, {emailLink: true}).html,
 `<p><strong><a href="mailto:${siteVariables.accountDeletionEmail}">${siteVariables.accountDeletionEmail}</a></strong></p>`
);
assert.throws(() => markdown('{{legalName}'), /Unresolved document variable/);
assert.throws(() => markdown('[Pendiente]'), /Legacy pending placeholder/);
assert.equal(markdown('**Premium**\n- Benefit').html, '<p><strong>Premium</strong></p><ul><li>Benefit</li></ul>');
assert.throws(() => markdown('{{taxId}}', {variables: {...siteVariables, taxId: null}}), /Required document variable is pending: taxId/);
assert.throws(
 () => markdown(emailMarker, {variables: {...siteVariables, accountDeletionEmail: 'bad@example.test?subject=x'}}),
 /Invalid email variable/
);
const changedVariables = {
 ...siteVariables,
 legalName: '<Titular de prueba> & **texto**',
 professionalAddress: 'Domicilio de prueba',
 legalContactEmail: 'legal@example.test',
 accountDeletionEmail: 'deletion@example.test',
 supportEmail: 'support@example.test',
 taxId: null
};
const renderedPage = (lang, section) => fs.readFileSync(path.join(output, lang, section, 'index.html'), 'utf8');
try {
 build({preview, variables: changedVariables});
 for (const lang of config.languages) {
  const terms = renderedPage(lang, 'terms');
  for (const key of ['legalName', 'professionalAddress', 'legalContactEmail']) {
   assert(terms.includes(escape(changedVariables[key])), `${lang}: missing substituted ${key}`);
  }
  assert.equal(terms.split(changedVariables.legalContactEmail).length - 1, 2);
  for (const id of ['document-title', 'acceptance', 'plan-basic', 'plan-premium', 'plan-vip',
   ...Array.from({length: 17}, (_, index) => `section-${index + 1}`)]) {
   assert(terms.includes(`id="${id}"`), `${lang}: missing historical anchor ${id}`);
  }
  for (const section of ['privacy', 'faq', 'contact', 'delete-account'].filter(code => sectionsFor(preview).includes(code))) {
   const source = fs.readFileSync(path.join(root, 'src', lang, `${section}.md`), 'utf8');
   const page = renderedPage(lang, section);
   for (const [, key] of source.matchAll(/\{\{(\w+Email)\}\}/g)) {
    assert(page.includes(escape(changedVariables[key])), `${lang}/${section}: ${key} was not updated`);
   }
  }
 }
} finally {
 build({preview});
}
assert.deepEqual(snapshot(output), before, 'Test values must not remain in generated output');
assert.equal(markdown('- **Tax ID:** {{?taxId}}', {variables: changedVariables}).html, '');
assert.equal(markdown('- **Tax ID:** {{?taxId}}', {variables: {...changedVariables, taxId: 'TEST-ID'}}).html,
 '<ul><li><strong>Tax ID:</strong> TEST-ID</li></ul>');
const originalRequiredVariables = config.documents.terms.requiredVariables;
try {
 config.documents.terms.requiredVariables = ['taxId'];
 assert.throws(() => renderDocument('- Tax ID: {{?taxId}}', 'terms', changedVariables), /Required document variable is pending: taxId/);
} finally {
 if (originalRequiredVariables === undefined) delete config.documents.terms.requiredVariables;
 else config.documents.terms.requiredVariables = originalRequiredVariables;
}
const originalStatus = config.documents['delete-account'].status;
const originalVerification = config.accountDeletionVerified;
try {
 config.documents['delete-account'].status = 'review';
 assert(!sectionsFor(false).includes('delete-account'));
 assert(sectionsFor(true).includes('delete-account'));
 config.documents['delete-account'].status = 'approved';
 config.accountDeletionVerified = false;
 assert.throws(() => sectionsFor(false), /readiness must be verified/);
 config.accountDeletionVerified = true;
 assert(sectionsFor(false).includes('delete-account'));
} finally {
 config.documents['delete-account'].status = originalStatus;
 config.accountDeletionVerified = originalVerification;
}
assert(markdown('# Title\n\n## 1. Section\n\n<script>alert(1)</script>').html.includes('&lt;script&gt;'));
assert(!markdown('# Title\n\n<script>alert(1)</script>').html.includes('<script>'));
assert.throws(()=>markdown('> unsupported block'),'Unsupported Markdown must not silently lose content');
console.log('PASS: deterministic builds, HTML escaping, variable rendering and publication guard.');
