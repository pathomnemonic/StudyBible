// Turns the plain-text list files written for a batch (## id | theme | prompt, context:, basis:, Answer|tier|alias) into src/data/deepWatersBatch.json, checking and repairing as it goes.
//   npx tsx scripts/deepwaters/import-batch.ts <dir-with-out*.txt>
// Repairs: a repeated answer or alias form is dropped, an answer that reduces to nothing is dropped, a bad tier is clamped, a list that repeats an existing prompt or has nearly the same
// answers as an existing list is skipped, a "closed" list whose size is wrong is made open. The report says everything it changed. Nothing is invented.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { BASE_PROMPTS as ALL_BASE } from '../../src/data/deepWaters';
import { deepTokens } from '../../src/lib/deepWatersTokens';

const dir = process.argv[2];
// the batch's own earlier output is not "existing": importing again replaces it
const BASE_PROMPTS = ALL_BASE.filter((p) => !p.id.startsWith('authored7-'));
const THEMES = new Set(['scripture', 'saints', 'church-history', 'liturgy', 'doctrine', 'devotion', 'places', 'art-music', 'people']);
const key = (s: string, ignore: string[] = []) => deepTokens(s, ignore).join(' ');
const existingPrompts = new Set(BASE_PROMPTS.map((p) => p.prompt.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()));
const existingDisplay = new Set(BASE_PROMPTS.map((p) => p.answers.map((a) => a.answer).sort().join('|')));
const existingSets = BASE_PROMPTS.map((p) => new Set(p.answers.flatMap((a) => [a.answer, ...(a.aliases ?? [])]).map((x) => key(x))));
const out: Record<string, unknown>[] = []; const report: string[] = []; const usedIds = new Set(BASE_PROMPTS.map((p) => p.id));
const usedPrompts = new Set<string>();
let blocksSeen = 0;
for (const f of readdirSync(dir).filter((x) => /^out\d+\.txt$/.test(x)).sort()) {
  const text = readFileSync(`${dir}/${f}`, 'utf8').replace(/\r/g, '');
  for (const block of text.split(/\n(?=## )/)) {
    if (!block.startsWith('## ')) continue;
    blocksSeen++;
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const head = lines[0].slice(3).split('|').map((x) => x.trim());
    if (head.length < 3) { report.push(`${f}: bad heading ${lines[0]}`); continue; }
    const [rawId, rawTheme, prompt] = [head[0], head[1], head.slice(2).join('|')];
    const theme = rawTheme === 'culture' ? 'church-history' : rawTheme;
    const id = `authored7-${rawId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    let context = '', basis = '', closed: number | undefined; const answers: { answer: string; tier: number; aliases?: string[] }[] = [];
    for (const l of lines.slice(1)) {
      if (/^context:/i.test(l)) context = l.replace(/^context:\s*/i, '');
      else if (/^basis:/i.test(l)) basis = l.replace(/^basis:\s*/i, '');
      else if (/^closed:/i.test(l)) closed = Number(l.replace(/^closed:\s*/i, '').split(/\s/)[0]);
      else if (l.includes('|')) {
        const [a, t, al] = l.split('|'); const tier = Math.max(1, Math.min(6, Math.round(Number(t) || 3)));
        const aliases = al ? al.split(';').map((x) => x.trim()).filter(Boolean) : [];
        if (a.trim()) answers.push({ answer: a.trim(), tier, ...(aliases.length ? { aliases } : {}) });
      }
    }
    const tag = `${f} ${rawId}`;
    if (!THEMES.has(theme)) { report.push(`${tag}: unknown theme ${theme}, skipped`); continue; }
    if (!/^Name /.test(prompt) || /\b(above|below)\b/i.test(`${prompt} ${context}`)) { report.push(`${tag}: bad prompt wording, skipped`); continue; }
    const pk = prompt.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (existingPrompts.has(pk) || usedPrompts.has(pk)) { report.push(`${tag}: prompt already exists, skipped`); continue; }
    if (usedIds.has(id)) { report.push(`${tag}: id already used, skipped`); continue; }
    // repair the answers
    const seen = new Set<string>(); const fixed: typeof answers = [];
    for (const a of answers) {
      const k = key(a.answer);
      if (!k || seen.has(k)) { report.push(`${tag}: dropped answer "${a.answer}"`); continue; }
      seen.add(k);
      const al = (a.aliases ?? []).filter((x) => { const kx = key(x); if (!kx || seen.has(kx)) return false; seen.add(kx); return true; });
      fixed.push({ answer: a.answer, tier: a.tier, ...(al.length ? { aliases: al } : {}) });
    }
    if (fixed.length < (closed !== undefined && closed === fixed.length ? 5 : 12)) { report.push(`${tag}: only ${fixed.length} usable answers, skipped`); continue; }
    if (existingDisplay.has(fixed.map((a) => a.answer).sort().join('|'))) { report.push(`${tag}: exactly the same answers as an existing list, skipped`); continue; }
    const mine = new Set(fixed.flatMap((a) => [a.answer, ...(a.aliases ?? [])]).map((x) => key(x)));
    const dup = existingSets.findIndex((s) => { let both = 0; for (const x of mine) if (s.has(x)) both++; return both / (mine.size + s.size - both) > 0.7; });
    if (dup >= 0) { report.push(`${tag}: nearly the same answers as existing "${BASE_PROMPTS[dup].prompt}", skipped`); continue; }
    if (closed !== undefined && closed !== fixed.length) { report.push(`${tag}: closed ${closed} but ${fixed.length} answers, made open`); closed = undefined; }
    const tier1 = fixed.filter((a) => a.tier === 1).length;
    if (tier1 < 3) report.push(`${tag}: only ${tier1} first-tier answers (will not be asked daily)`);
    usedIds.add(id); usedPrompts.add(pk);
    out.push({ id, theme, prompt, context: context || 'Any one of these counts. This list is not complete.', basis: basis || 'Hand-authored.', ...(closed !== undefined ? { closed } : {}), answers: fixed });
  }
}
writeFileSync(new URL('../../src/data/deepWatersBatch.json', import.meta.url).pathname, JSON.stringify(out));
console.log(`${out.length} lists kept of ${blocksSeen}; ${out.reduce((n, p) => n + (p.answers as unknown[]).length, 0)} answers`);
writeFileSync(`${dir}/import-report.txt`, report.join('\n'));
console.log(`report: ${report.length} notes in ${dir}/import-report.txt`);
