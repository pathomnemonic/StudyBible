// Adds a page to the app without hand-editing the shared files, safely when several people work at once:
//   flock /tmp/wire.lock node scripts/dev/wire.mjs spec.json
// spec: { routes: [{ path, file, name }], features: [Feature], playTiles: ["G(...) line"], changelog: "markdown" }
//   file is relative to src/, without extension, e.g. "pages/study/AskFathersPage"; the module must have a default export.
// Safe to run again: anything already present is skipped.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
const spec = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const edit = (file, fn) => { const s = readFileSync(file, 'utf8'); const t = fn(s); if (t !== s) writeFileSync(file, t); };
const log = [];
for (const r of spec.routes ?? []) {
  edit('src/App.tsx', (s) => {
    if (s.includes(`path="${r.path}"`)) { log.push(`skip route ${r.path}`); return s; }
    const imp = `const ${r.name} = lazy(() => import('./${r.file}'));`;
    if (!s.includes(imp)) s = s.replace(/(const QuizNightPage = lazy\([^\n]*\n)/, `$1${imp}\n`);
    return s.replace(/(\n[ ]*<Route path="\/play\/quiznight" element=\{<QuizNightPage \/>\} \/>)/, `$1\n              <Route path="${r.path}" element={<${r.name} />} />`);
  });
  log.push(`route ${r.path}`);
}
for (const f of spec.features ?? []) {
  edit('src/lib/features.ts', (s) => {
    if (s.includes(`id: '${f.id}'`)) { log.push(`skip feature ${f.id}`); return s; }
    const q = (v) => (typeof v === 'string' ? `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'` : JSON.stringify(v));
    const line = `  { ${Object.entries(f).map(([k, v]) => `${k}: ${q(v)}`).join(', ')} },\n`;
    return s.replace(/(  \{ id: 'learn\.quiznight',)/, `${line}$1`);
  });
  log.push(`feature ${f.id}`);
}
for (const t of spec.playTiles ?? []) {
  edit('src/pages/play/PlayHome.tsx', (s) => (s.includes(t) ? s : s.replace(/(    G\('\/play\/quiznight',[^\n]*\n)/, `$1    ${t}\n`)));
  log.push('play tile');
}
if (spec.changelog) appendFileSync('docs/CHANGELOG.md', `\n${spec.changelog}\n`);
console.log(log.join('\n'));
