import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, config, outputDirectory } from './build.mjs';

const languages = ['es', 'en', 'pt', 'fr', 'it', 'de'];
const sections = ['terms', 'privacy', 'faq', 'contact', 'delete-account'];
const workflow = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
const uploadStep = workflow.match(/uses: actions\/upload-pages-artifact@[^\n]+\n\s+with:\s*\n\s+path: (\S+)/);
assert.equal(uploadStep?.[1], outputDirectory(false), 'Pages must upload the production build directory');
for (const script of ['build', 'validate', 'test']) {
 assert.match(workflow, new RegExp(`^\\s+run: node scripts/${script}\\.mjs$`, 'm'));
}

assert.deepEqual(config.languages, languages);
assert.deepEqual(Object.keys(config.documents), sections);

for (const script of ['build', 'validate', 'test']) {
 execFileSync(process.execPath, [`scripts/${script}.mjs`], {cwd: root, stdio: 'inherit'});
}
const artifact = path.join(root, uploadStep[1]);
assert(fs.statSync(path.join(artifact, 'index.html')).isFile());
for (const lang of languages) {
 for (const section of sections) {
  assert(fs.statSync(path.join(artifact, lang, section, 'index.html')).isFile(), `Missing ${lang}/${section}/`);
 }
}
console.log('PASS: 30 document pages plus home in the Pages artifact.');
