/**
 * The Pilgrim's Passport: which stamp a page earns. Pure functions only (no storage, no React), so the table can be tested.
 * The route-change watcher (components/PassportWatcher) asks `stampsFor` after every navigation, so no page needs to know about the passport.
 */
export type Kind =
  | 'saint' | 'council' | 'work' | 'catechism' | 'lesson'
  | 'argument' | 'heresy' | 'development' | 'claim' | 'word'
  | 'life' | 'mentor' | 'walk'
  | 'feast' | 'feastcard' | 'readings'
  | 'game' | 'hub' | 'place';

export type Category = 'saints' | 'councils' | 'library' | 'arguments' | 'lives' | 'feasts' | 'games' | 'places';

export interface Draft { kind: Kind; id: string; label: string }

export const CATEGORIES: { id: Category; title: string; blurb: string; icon: string }[] = [
  { id: 'saints', title: 'Saints', blurb: 'Saints’ days and your own saints.', icon: '🕊️' },
  { id: 'councils', title: 'Councils', blurb: 'The ecumenical councils, one by one.', icon: '🏛️' },
  { id: 'library', title: 'Fathers and library', blurb: 'Works, the Catechism and lessons you opened.', icon: '📜' },
  { id: 'arguments', title: 'Arguments and heresies', blurb: 'Chains of argument, errors, words and claims.', icon: '⚖️' },
  { id: 'lives', title: 'Lives and mentors', blurb: 'Lives of the saints, mentors and walks through Scripture.', icon: '🥾' },
  { id: 'feasts', title: 'Feasts and readings', blurb: 'Feast cards and days of Mass readings.', icon: '🕯️' },
  { id: 'games', title: 'Games', blurb: 'Games you have opened or finished.', icon: '🎲' },
  { id: 'places', title: 'Places', blurb: 'The first time you enter each part of the app.', icon: '🧭' },
];

export const CATEGORY_OF: Record<Kind, Category> = {
  saint: 'saints', council: 'councils', work: 'library', catechism: 'library', lesson: 'library',
  argument: 'arguments', heresy: 'arguments', development: 'arguments', claim: 'arguments', word: 'arguments',
  life: 'lives', mentor: 'lives', walk: 'lives', feast: 'feasts', feastcard: 'feasts', readings: 'feasts',
  game: 'games', hub: 'places', place: 'places',
};

export const KIND_ICON: Record<Kind, string> = {
  saint: '🕊️', council: '🏛️', work: '📜', catechism: '✝️', lesson: '🎓', argument: '⚖️', heresy: '🔥', development: '🌱', claim: '❓', word: '🔤',
  life: '📖', mentor: '🤝', walk: '🥾', feast: '🕯️', feastcard: '🕯️', readings: '📜', game: '🎲', hub: '🧭', place: '📍',
};

/** The games that have their own page, with the name shown on the stamp. */
export const GAMES: Record<string, string> = {
  trivia: 'Trivia', verbum: 'Verbum', quartets: 'Quartets', whosaid: 'Who said it?', whichbook: 'Which book?', chain: 'Chain', pilgrim: 'Pilgrim',
  crossword: 'Crossword', cloister: 'Cloister', prophet: 'Prophet', charades: 'Charades', wordsearch: 'Word search', saintguess: 'Guess the saint',
  whoami: 'Who am I?', artdetective: 'Art detective', doctrineladder: 'Doctrine ladder', quiznight: 'Quiz night', online: 'Online play',
};

export const HUB_ROOTS: Record<string, { id: string; label: string }> = {
  '/': { id: 'today', label: 'Today' }, '/today': { id: 'today', label: 'Today' }, '/read': { id: 'bible', label: 'The Bible' }, '/room': { id: 'read', label: 'Read' },
  '/learn': { id: 'learn', label: 'Learn' }, '/study': { id: 'study', label: 'Explore' }, '/pray': { id: 'pray', label: 'Pray' }, '/listen': { id: 'listen', label: 'Media' },
  '/teach': { id: 'teach', label: 'Teach' }, '/profile': { id: 'you', label: 'You' }, '/play': { id: 'games', label: 'Games' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_IN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const validMd = (md: string) => { const m = /^(\d{2})-(\d{2})$/.exec(md); if (!m) return false; const mo = +m[1], d = +m[2]; return mo >= 1 && mo <= 12 && d >= 1 && d <= DAYS_IN[mo - 1]; };
export const mdLabel = (md: string) => `${+md.slice(3)} ${MONTHS[+md.slice(0, 2) - 1]}`;
export const validIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && validMd(s.slice(5));
export const isoLabel = (s: string) => `${+s.slice(8)} ${MONTHS[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}`;
const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** "mary-in-scripture" becomes "Mary in scripture": a readable fallback when the stamp is made before the page's data is known. */
export const prettify = (slug: string) => { const t = decodeURIComponent(slug).replace(/[-_]+/g, ' ').trim(); return t ? t[0].toUpperCase() + t.slice(1) : slug; };
const seg = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

/** The place each council met, as [name, latitude, longitude], for the map. Councils at Rome, Constantinople, Nicaea and Lyon share a pin. */
export const COUNCIL_PLACES: Record<number, [string, number, number]> = {
  1: ['Nicaea', 40.43, 29.72], 2: ['Constantinople', 41.01, 28.98], 3: ['Ephesus', 37.94, 27.34], 4: ['Chalcedon', 40.99, 29.03],
  5: ['Constantinople', 41.01, 28.98], 6: ['Constantinople', 41.01, 28.98], 7: ['Nicaea', 40.43, 29.72], 8: ['Constantinople', 41.01, 28.98],
  9: ['Rome', 41.9, 12.47], 10: ['Rome', 41.9, 12.47], 11: ['Rome', 41.9, 12.47], 12: ['Rome', 41.9, 12.47], 13: ['Lyon', 45.76, 4.84], 14: ['Lyon', 45.76, 4.84],
  15: ['Vienne', 45.52, 4.88], 16: ['Constance', 47.66, 9.18], 17: ['Florence', 43.77, 11.25], 18: ['Rome', 41.9, 12.47], 19: ['Trent', 46.07, 11.12],
  20: ['Rome', 41.9, 12.47], 21: ['Rome', 41.9, 12.47],
};
export const COUNCIL_COUNT = 21;

/** "3. Ephesus" (the text of a council's button on the Councils page) gives 3. */
export function councilFromText(text: string): number | null {
  const m = /^\s*(\d{1,2})\.\s/.exec(text);
  const n = m ? +m[1] : 0;
  return n >= 1 && n <= COUNCIL_COUNT ? n : null;
}
export const councilDraft = (n: number, name?: string): Draft => ({ kind: 'council', id: String(n), label: name || `Council ${n}` });

type Rule = { re: RegExp; make: (m: RegExpExecArray, now: Date, search: URLSearchParams) => Draft | null };
const idRule = (re: RegExp, kind: Kind, noun = ''): Rule => ({ re, make: (m) => (m[1] ? { kind, id: seg(m[1]), label: noun ? `${prettify(m[1])}` : prettify(m[1]) } : null) });

const RULES: Rule[] = [
  { re: /^\/(?:study\/saints|s\/saint)\/([^/]+)$/, make: (m) => (validMd(m[1]) ? { kind: 'saint', id: m[1], label: `Saints of ${mdLabel(m[1])}` } : null) },
  { re: /^\/my-saints$/, make: () => ({ kind: 'saint', id: 'my-saints', label: 'My saints' }) },
  { re: /^\/study\/councils$/, make: (_m, _n, q) => { const n = +(q.get('n') ?? 0); return n >= 1 && n <= COUNCIL_COUNT ? councilDraft(n) : null; } },
  { re: /^\/(?:room\/work|study\/works)\/([^/]+)(?:\/.*)?$/, make: (m) => ({ kind: 'work', id: seg(m[1]), label: prettify(m[1]) }) },
  { re: /^\/study\/catechism\/(\d{1,4})$/, make: (m) => ({ kind: 'catechism', id: m[1], label: `Catechism §${m[1]}` }) },
  { re: /^\/study\/curriculum\/([^/]+)\/([^/]+)$/, make: (m) => (m[2] === 'packet' ? null : { kind: 'lesson', id: `${seg(m[1])}/${seg(m[2])}`, label: `Lesson ${prettify(m[2])}` }) },
  idRule(/^\/study\/arguments\/([^/]+)$/, 'argument'),
  idRule(/^\/study\/heresies\/([^/]+)$/, 'heresy'),
  idRule(/^\/study\/development\/([^/]+)$/, 'development'),
  idRule(/^\/study\/claims\/([^/]+)$/, 'claim'),
  idRule(/^\/study\/words\/([^/]+)$/, 'word'),
  idRule(/^\/study\/lives\/([^/]+)$/, 'life'),
  idRule(/^\/study\/mentors\/([^/]+)$/, 'mentor'),
  idRule(/^\/study\/walks\/([^/]+)$/, 'walk'),
  idRule(/^\/s\/feast\/([^/]+)$/, 'feast'),
  { re: /^\/feast(?:\/([^/]+))?$/, make: (m, now) => { const d = m[1] ?? localIso(now); return validIso(d) ? { kind: 'feastcard', id: d, label: `Feast card, ${isoLabel(d)}` } : null; } },
  { re: /^\/pray\/readings(?:\/([^/]+))?$/, make: (m, now) => { const d = m[1] ?? localIso(now); return validIso(d) ? { kind: 'readings', id: d, label: `Readings, ${isoLabel(d)}` } : null; } },
  { re: /^\/play\/([a-z]+)$/, make: (m) => (GAMES[m[1]] ? { kind: 'game', id: m[1], label: GAMES[m[1]] } : null) },
];

/** The stamps earned by being on this page (a path with no leading "#", and its query string). */
export function stampsFor(pathname: string, search = '', now: Date = new Date()): Draft[] {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const q = new URLSearchParams(search);
  const out: Draft[] = [];
  const hub = HUB_ROOTS[path];
  if (hub) out.push({ kind: 'hub', id: hub.id, label: hub.label });
  for (const r of RULES) { const m = r.re.exec(path); if (m) { const d = r.make(m, now, q); if (d) out.push(d); break; } }
  return out;
}

/** Rows for the map: one pin per place, with the councils held there. */
export function councilPins(held: Set<string>): { place: string; lat: number; lon: number; councils: number[]; got: number[] }[] {
  const by = new Map<string, { place: string; lat: number; lon: number; councils: number[]; got: number[] }>();
  for (const [k, [place, lat, lon]] of Object.entries(COUNCIL_PLACES)) {
    const n = +k;
    const e = by.get(place) ?? by.set(place, { place, lat, lon, councils: [], got: [] }).get(place)!;
    e.councils.push(n);
    if (held.has(String(n))) e.got.push(n);
  }
  return [...by.values()];
}
