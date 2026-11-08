import { loadChains, loadFiles, verifyChain, verifyLife, verifySituation } from './verify';
import type { Life, Situation } from '../../src/chains/types';
const mode = process.argv[2];
const modes = mode && !['situations', 'lives'].includes(mode) ? [mode] : mode ? [] : ['arguments', 'development', 'heresies', 'words', 'claims'];
let bad = 0;
for (const m of modes) {
  const cs = loadChains(m); const ids = new Set<string>();
  for (const c of cs) { if (ids.has(c.id)) { console.log(`${m}: duplicate id ${c.id}`); bad++; } ids.add(c.id); for (const e of verifyChain(c)) { console.log(`${m}: ${e}`); bad++; } }
  console.log(`${m}: ${cs.length} chains, ${cs.reduce((n, c) => n + c.steps.length, 0)} steps`);
}
if (!mode || mode === 'situations') { const ss = loadFiles<Situation>('situations'); for (const x of ss) for (const e of verifySituation(x)) { console.log(`situations: ${e}`); bad++; } console.log(`situations: ${ss.length}, ${ss.reduce((n, x) => n + x.mentors.length, 0)} mentors`); }
if (!mode || mode === 'lives') { const ls = loadFiles<Life>('lives'); for (const x of ls) for (const e of verifyLife(x)) { console.log(`lives: ${e}`); bad++; } console.log(`lives: ${ls.length}, ${ls.reduce((n, x) => n + x.events.length, 0)} events`); }
console.log(bad ? `${bad} problems` : 'all quotes verified');
process.exit(bad ? 1 : 0);
