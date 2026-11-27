// Adds a page to the app without hand-editing the shared files, safely when several people work at once:
//   flock /tmp/wire.lock node scripts/dev/wire.mjs spec.json
// spec: { routes: [{ path, file, name }], features: [Feature], playTiles: ["G(...) line"], changelog: "markdown" }
//   file is relative to src/, without extension, e.g. "pages/study/AskFathersPage"; the module must have a default export.
// Safe to run again: anything already present is skipped, and the changelog is appended only if it is not already there.
// The log says what actually happened: an item whose anchor text is not found is reported FAILED, never as done.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
const spec = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const edit = (file, fn) => { const s = readFileSync(file, 'utf8'); const t = fn(s); if (t !== s) writeFileSync(file, t); };
const log = [];
for (const r of spec.routes ?? []) {
  const before = readFileSync('src/App.tsx', 'utf8');
  if (before.includes(`path="${r.path}"`)) { log.push(`skip route ${r.path}`); continue; }
  const imp = `const ${r.name} = lazy(() => import('./${r.file}'));`;
  const hasImp = before.includes(imp);
  if (!hasImp && !/(const QuizNightPage = lazy\([^\n]*\n)/.test(before)) { log.push(`FAILED route ${r.path}: import anchor not found in src/App.tsx`); continue; }
  if (!/(\n[ ]*<Route path="\/play\/quiznight" element=\{<QuizNightPage \/>\} \/>)/.test(before)) { log.push(`FAILED route ${r.path}: route anchor not found in src/App.tsx`); continue; }
  edit('src/App.tsx', (s) => {
    if (!hasImp) s = s.replace(/(const QuizNightPage = lazy\([^\n]*\n)/, `$1${imp}\n`);
    return s.replace(/(\n[ ]*<Route path="\/play\/quiznight" element=\{<QuizNightPage \/>\} \/>)/, `$1\n              <Route path="${r.path}" element={<${r.name} />} />`);
  });
  log.push(`route ${r.path}`);
}
for (const f of spec.features ?? []) {
  const before = readFileSync('src/lib/features.ts', 'utf8');
  if (before.includes(`id: '${f.id}'`)) { log.push(`skip feature ${f.id}`); continue; }
  if (!/(  \{ id: 'learn\.quiznight',)/.test(before)) { log.push(`FAILED feature ${f.id}: anchor not found in src/lib/features.ts`); continue; }
  edit('src/lib/features.ts', (s) => {
    const q = (v) => (typeof v === 'string' ? `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'` : JSON.stringify(v));
    const line = `  { ${Object.entries(f).map(([k, v]) => `${k}: ${q(v)}`).join(', ')} },\n`;
    return s.replace(/(  \{ id: 'learn\.quiznight',)/, `${line}$1`);
  });
  log.push(`feature ${f.id}`);
}
for (const t of spec.playTiles ?? []) {
  const before = readFileSync('src/pages/play/PlayHome.tsx', 'utf8');
  if (before.includes(t)) { log.push('skip play tile'); continue; }
  if (!/(    G\('\/play\/quiznight',[^\n]*\n)/.test(before)) { log.push('FAILED play tile: anchor not found in src/pages/play/PlayHome.tsx'); continue; }
  edit('src/pages/play/PlayHome.tsx', (s) => s.replace(/(    G\('\/play\/quiznight',[^\n]*\n)/, `$1    ${t}\n`));
  log.push('play tile');
}
if (spec.changelog) {
  if (readFileSync('docs/CHANGELOG.md', 'utf8').includes(spec.changelog)) log.push('skip changelog');
  else { appendFileSync('docs/CHANGELOG.md', `\n${spec.changelog}\n`); log.push('changelog'); }
}
console.log(log.join('\n'));
