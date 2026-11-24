// Checks the saint and Father lines in public/data/daily/index.json against the bundled public-domain library (public/data/library/works).
//   npx tsx scripts/verify/daily-quotes.ts     report only (it changes nothing)
// Lists (1) lines marked verified that are not word for word in their cited section, and (2) unverified lines that do appear in some library work (often a later author quoting the saint: a lead for a person to follow, not proof of the attribution).
// A line is "found" when its words (case, punctuation and spacing ignored) appear in one section of one work. Nothing is invented: a line that is not found stays unverified.
import { readdirSync, readFileSync } from 'node:fs';
import { norm } from '../chains/verify';

const DATA = new URL('../../public/data/', import.meta.url).pathname;
const FILE = DATA + 'daily/index.json';
const daily = JSON.parse(readFileSync(FILE, 'utf8')) as { generic: Record<string, any>; seasonal: Record<string, any> };
const works = readdirSync(DATA + 'library/works').filter((f) => f.endsWith('.json')).map((f) => { const w = JSON.parse(readFileSync(DATA + 'library/works/' + f, 'utf8')); return { id: f.replace(/\.json$/, ''), title: w.title as string, author: (w.author ?? '') as string, sections: (w.sections as { id: string; title: string; paras: string[] }[]).map((s) => norm([s.title, ...s.paras].join(' '))) }; });

function find(text: string): { work: string; section: number; author: string; title: string } | null {
  const segs = text.split(/…|\.\.\./).map(norm).filter((s) => s.length >= 25);
  if (!segs.length) return null;
  for (const w of works) for (let i = 0; i < w.sections.length; i++) if (segs.every((s) => w.sections[i].includes(s))) return { work: w.id, section: i, author: w.author, title: w.title };
  return null;
}

let checked = 0, nowFound = 0, stillBad = 0, recheckFail = 0;
const report: string[] = [];
for (const [kind, group] of Object.entries(daily)) for (const [key, e] of Object.entries(group)) {
  const s = e.saint; if (!s?.text) continue; checked++;
  const hit = find(s.text);
  if (s.verified === true) {
    // a verified line must still be in its source
    const w = s.src?.work && works.find((x) => x.id === s.src.work);
    if (w && s.src.section != null && !(w.sections[s.src.section] ?? '').includes(norm(s.text.split(/…|\.\.\./)[0]))) { recheckFail++; report.push(`${kind}/${key}: marked verified but not found in ${s.src.work} section ${s.src.section}`); }
    continue;
  }
  if (hit) { nowFound++; report.push(`${kind}/${key}: FOUND in ${hit.work} (${hit.title}, ${hit.author}) section ${hit.section}; attributed to "${s.who}"${s.work ? `, ${s.work}` : ''}${s.misattributed ? ' [has a misattribution note]' : ''}`); }
  else stillBad++;
}
console.log(`checked ${checked}; unverified now found in the library: ${nowFound}; still not found: ${stillBad}; verified but not found in their source: ${recheckFail}`);
console.log(report.join('\n'));
