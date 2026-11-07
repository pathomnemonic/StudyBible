import type { BandId, LessonSpec } from './model';
import { KIT_RANK, TECHNIQUES, type Ctx, type Kit, type Move, type Option, type Technique } from './techniques';

/**
 * Turns one lesson into a menu of ways to teach it.  Every idea in the lesson (its talking points) gets three options of
 * different kinds (something to say or discuss, something to do or make, something to read or see), plus several ways to
 * open and to close.  Which ones appear depends on what the teacher has: voice only, paper, a screen, or student devices.
 * Choice and order are deterministic per lesson, so adjacent lessons feel different and a reload shows the same menu.
 */
export type Setup = Kit;
export const SETUPS: [Setup, string, string][] = [
  ['voice', 'Just me', 'No materials: talking, moving, thinking'],
  ['paper', 'Paper and a board', 'Pencils, paper, a whiteboard or posters'],
  ['screen', 'A screen or projector', 'Slides, pictures and video'],
  ['devices', 'Student devices too', 'Phones or tablets for a live quiz or self-paced play'],
];

export interface ConceptMenu { n: number; concept: string; gist: string; term: string; options: Option[] }
export interface LessonMenu { opening: Option[]; concepts: ConceptMenu[]; closing: Option[]; setup: Setup }

const hash = (s: string) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const ABBREV = /(?:^|[\s(])(?:c|ca|St|Sts|Mt|Mk|Lk|Jn|vs|cf|e\.g|i\.e|Fr|Dr|Mr|Mrs|No|Ch|Vol|ff|Sr|Jr|vv|v|ch|Ps|Is|Jer|Ez|Dn|Hos|Gn|Ex|Lv|Nm|Dt)$/;
/** the first sentence, not cut at abbreviations such as "c." or "St." and never at a verse reference */
export const firstSentence = (t: string, max = 150) => {
  const s = t.replace(/\s+/g, ' ').trim();
  let end = -1;
  for (let i = 0; i < s.length; i++) {
    if (!'.!?'.includes(s[i])) continue;
    const next = s[i + 1];
    if (next !== undefined && next !== ' ' && next !== '”' && next !== ')') continue;
    if (i < 20 || ABBREV.test(s.slice(0, i)) || /\d$/.test(s.slice(0, i)) && /^ ?\d/.test(s.slice(i + 1))) continue;
    end = i + 1; break;
  }
  let g = end > 0 ? s.slice(0, end) : s;
  if (g.length > max) g = g.slice(0, max).replace(/\s+\S*$/, '').replace(/\s*\([^)]*$/, '') + '…';
  return g;
};
const BAND_DEFAULT_MIN: Record<BandId, number> = { primary: 6, elementary: 8, middle: 10, high: 12, adult: 14 };

function contextFor(l: LessonSpec, band: BandId, concept: string, n: number, gl: Record<string, { w: string; d: string }>): Ctx {
  // the lesson word that appears in the idea, else a rotating one
  const lower = concept.toLowerCase();
  const own = l.vocab.filter((v) => gl[v]);
  const term = own.find((v) => lower.includes(gl[v].w.toLowerCase())) ?? own[n % Math.max(1, own.length)] ?? l.vocab[0] ?? l.title;
  const saintName = l.saint?.split(':')[0]?.trim();
  return {
    concept, gist: firstSentence(concept), term: gl[term]?.w ?? term, termDef: gl[term]?.d ?? '', title: l.title, question: l.question,
    scripture: l.scripture ?? '', saint: l.saint, saintName, misc: l.misc?.[n % Math.max(1, l.misc.length)], mem: l.mem, hook: l.hook, band,
    who: band === 'primary' ? 'children' : band === 'adult' ? 'participants' : 'students', n,
  };
}
const minutesFor = (t: Technique, band: BandId) => t.minutes[0][band] ?? t.minutes[1] ?? BAND_DEFAULT_MIN[band];

function realise(t: Technique, c: Ctx, listenFor = false): Option {
  const tip = t.tip?.(c);
  const listen = listenFor && c.misc && t.id !== 'mythtruth' ? `Listen for this common misunderstanding: ${c.misc.startsWith('“') ? c.misc : `“${c.misc}”`}` : '';
  return { id: t.id, title: t.title, method: t.method, move: t.move, kit: t.kit, minutes: minutesFor(t, c.band), prep: t.prep(c), steps: t.steps(c), without: t.without?.(c), tip: [tip, listen].filter(Boolean).join(' ') || undefined };
}
const usable = (t: Technique, c: Ctx, setup: Setup) => t.bands.includes(c.band) && KIT_RANK[t.kit] <= KIT_RANK[setup] && (!t.fits || t.fits(c));
const rank = (t: Technique, key: string) => hash(key + t.id);

/** the best unused technique of a given move, rotating by the lesson so neighbours differ */
function pick(moves: Move[], c: Ctx, setup: Setup, used: Set<string>, key: string): Technique | undefined {
  const pool = TECHNIQUES.filter((t) => moves.includes(t.move) && !used.has(t.id) && usable(t, c, setup));
  // prefer a technique that needs the best kit the teacher has (so screens get used when present)
  pool.sort((a, b) => (KIT_RANK[b.kit] === KIT_RANK[a.kit] ? rank(a, key) - rank(b, key) : (rank(a, key) % 3) - (rank(b, key) % 3)));
  return pool[0];
}

export function ideasOf(l: LessonSpec): string[] {
  const t = (l.teach ?? []).filter((x) => x.trim().length > 20);
  // K-2 teacher notes carry a fourth (pitfall) and fifth (check) point that are guidance, not extra ideas to teach
  if (t.length) return t.slice(0, /^(K|1|2)-/.test(l.id) ? 3 : 4);
  const sc = (l.script?.teach ?? []).filter((x) => x.trim().length > 20);
  if (sc.length) return sc.slice(0, 4);
  return [l.idea];
}

export function buildMenu(l: LessonSpec, band: BandId, gl: Record<string, { w: string; d: string }>, setup: Setup): LessonMenu {
  const ideas = ideasOf(l);
  const used = new Set<string>();
  const concepts: ConceptMenu[] = ideas.map((idea, n) => {
    const c = contextFor(l, band, idea, n, gl);
    const key = `${l.id}:${n}`;
    const options: Option[] = [];
    // a different kind of teaching each time: talk, do/make, read/see (and screens when the teacher has one)
    const plan: Move[][] = [['talk'], ['move', 'make'], ['read', 'see']];
    // rotate the order per concept so idea 1 does not always lead with the same kind
    const shift = hash(key) % 3;
    for (let i = 0; i < 3; i++) {
      const moves = plan[(i + shift) % 3];
      const local = new Set(options.map((o) => o.id));
      // prefer something not used for an earlier idea; reuse only when the menu would otherwise be short
      const t = pick(moves, c, setup, used, key + ':' + i) ?? pick(['talk', 'move', 'make', 'read', 'see'], c, setup, used, key + ':' + i)
        ?? pick(moves, c, setup, local, key + ':' + i) ?? pick(['talk', 'move', 'make', 'read', 'see'], c, setup, local, key + ':' + i);
      if (t) { options.push(realise(t, c, i === 0)); used.add(t.id); }
    }
    // a teacher with a screen should see at least one option that uses it
    if (KIT_RANK[setup] >= KIT_RANK.screen && !options.some((o) => KIT_RANK[o.kit] >= KIT_RANK.screen)) {
      const s = pick(['see', 'check'], c, setup, new Set(options.map((o) => o.id)), key + ':screen');
      if (s && KIT_RANK[s.kit] >= KIT_RANK.screen) options[options.length - 1] = realise(s, c);
    }
    return { n, concept: idea, gist: c.gist, term: c.term, options };
  });
  const c0 = contextFor(l, band, ideas[0], 0, gl);
  const opening: Option[] = []; const closing: Option[] = [];
  const ou = new Set(used); const cu = new Set(used);
  for (let i = 0; i < 3; i++) { const t = pick(['open'], c0, setup, ou, `${l.id}:open${i}`); if (t) { opening.push(realise(t, c0)); ou.add(t.id); } }
  for (let i = 0; i < 3; i++) { const t = pick(['check'], c0, setup, cu, `${l.id}:close${i}`); if (t) { closing.push(realise(t, contextFor(l, band, ideas[ideas.length - 1], ideas.length - 1, gl))); cu.add(t.id); } }
  if (setup === 'devices' && !closing.some((o) => o.kit === 'devices')) { const t = TECHNIQUES.find((x) => x.id === 'livequiz' && x.bands.includes(band)) ?? TECHNIQUES.find((x) => x.id === 'deviceplay'); if (t && closing.length) closing[closing.length - 1] = realise(t, c0); }
  return { opening, concepts, closing, setup };
}

export interface Choice { setup: Setup; picks: Record<string, number> }
export const keyFor = (section: 'open' | 'close' | number) => String(section);
export const chosen = (m: LessonMenu, picks: Record<string, number>) => ({
  opening: m.opening[picks.open ?? 0], concepts: m.concepts.map((c, i) => c.options[picks[String(i)] ?? 0]), closing: m.closing[picks.close ?? 0],
});
export const totalMinutes = (m: LessonMenu, picks: Record<string, number>) => {
  const c = chosen(m, picks);
  return [c.opening, ...c.concepts, c.closing].reduce((s, o) => s + (o?.minutes ?? 0), 0);
};

/** shortest-first: swap options for shorter ones, longest saving first, until the plan fits the time (or nothing shorter is left) */
export function fitToTime(m: LessonMenu, picks: Record<string, number>, minutes: number): Record<string, number> {
  const out = { ...picks };
  const sections: [string, Option[]][] = [['open', m.opening], ...m.concepts.map((c) => [String(c.n), c.options] as [string, Option[]]), ['close', m.closing]];
  for (let guard = 0; guard < 40 && totalMinutes(m, out) > minutes; guard++) {
    let best: { k: string; i: number; save: number } | null = null;
    for (const [k, opts] of sections) {
      const cur = opts[out[k] ?? 0]; if (!cur) continue;
      opts.forEach((o, i) => { const save = cur.minutes - o.minutes; if (save > 0 && (!best || save > best.save)) best = { k, i, save }; });
    }
    if (!best) break;
    out[(best as any).k] = (best as any).i;
  }
  return out;
}
