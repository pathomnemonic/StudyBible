import { COUNCILS } from '../data/councils';
import { FEASTS } from '../data/feasts';
import { HUBS } from './features';
import { GAMES, HUB_ROOTS, prettify, type Kind } from './passportMap';

/** Everything that has a stamp slot in the book, so the page can show empty places and suggest what to find next. Loaded when the page opens. */
export interface Item { kind: Kind; id: string; label: string; to: string }

export async function loadCatalog(): Promise<Item[]> {
  const out: Item[] = [];
  const hubIds = new Set(Object.values(HUB_ROOTS).map((h) => h.id));
  for (const h of HUBS) if (hubIds.has(h.id)) out.push({ kind: 'hub', id: h.id, label: h.title, to: h.to });
  out.push({ kind: 'hub', id: 'games', label: 'Games', to: '/play' });
  for (const c of COUNCILS) out.push({ kind: 'council', id: String(c.n), label: c.name, to: `/study/councils?n=${c.n}` });
  for (const [id, label] of Object.entries(GAMES)) out.push({ kind: 'game', id, label, to: `/play/${id}` });
  for (const f of FEASTS) out.push({ kind: 'feast', id: f.id, label: f.name, to: `/s/feast/${f.id}` });
  try {
    const { loadChains, loadLives, loadSituations } = await import('../chains/load');
    const modes: [Kind, string, string][] = [['argument', 'arguments', 'arguments'], ['heresy', 'heresies', 'heresies'], ['development', 'development', 'development'], ['claim', 'claims', 'claims'], ['word', 'words', 'words']];
    for (const [kind, mode, path] of modes) for (const c of await loadChains(mode as never)) out.push({ kind, id: c.id, label: c.title || prettify(c.id), to: `/study/${path}/${c.id}` });
    for (const l of await loadLives()) out.push({ kind: 'life', id: l.id, label: l.name, to: `/study/lives/${l.id}` });
    for (const s of await loadSituations()) out.push({ kind: 'mentor', id: s.id, label: s.title, to: `/study/mentors/${s.id}` });
  } catch { /* the chains are optional here */ }
  try {
    const w = (await import('../data/walks.json')).default as { id: string; title: string }[];
    for (const x of w) out.push({ kind: 'walk', id: x.id, label: x.title, to: `/study/walks/${x.id}` });
  } catch { /* optional */ }
  return out;
}
