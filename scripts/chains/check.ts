import { loadChains, verifyChain } from './verify';
const mode = process.argv[2];
const modes = mode ? [mode] : ['arguments', 'development', 'heresies', 'words'];
let bad = 0;
for (const m of modes) {
  const cs = loadChains(m); const ids = new Set<string>();
  for (const c of cs) { if (ids.has(c.id)) { console.log(`${m}: duplicate id ${c.id}`); bad++; } ids.add(c.id); for (const e of verifyChain(c)) { console.log(`${m}: ${e}`); bad++; } }
  console.log(`${m}: ${cs.length} chains, ${cs.reduce((n, c) => n + c.steps.length, 0)} steps`);
}
console.log(bad ? `${bad} problems` : 'all quotes verified');
process.exit(bad ? 1 : 0);
