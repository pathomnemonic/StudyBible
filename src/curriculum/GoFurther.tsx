import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getJson } from '../data/loader';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import { useToast } from '../components/Toast';
import { readerPath } from '../lib/nav';
import { refId, formatRef } from '../lib/refs';
import { convertRef } from '../lib/versification';
import { newCard } from '../lib/srs';
import { loadTracks } from '../lib/apolTracks';
import { loadChains } from '../chains/load';
import { MODES, type ChainMode } from '../chains/types';
import { buildGoFurther, keyVerseRef, type ExtrasLike, type FurtherLink, type Known, type LessonLike } from './goFurther';

/** What exists in the app, read from the same data files the pages use. Loaded once. */
let knownP: Promise<Known> | null = null;
const CHAIN_MODES: Record<string, ChainMode[]> = { chain: ['arguments', 'development'], claim: ['claims'], heresy: ['heresies'], development: ['development'], words: ['words'] };
export function loadKnown(): Promise<Known> {
  knownP ??= (async () => {
    const [apol, lib, ccc, tracks] = await Promise.all([
      getJson<{ topics: { id: string; title: string }[] }>('apologetics.json', true).catch(() => null),
      getJson<{ works: { id: string; title: string }[] }>('library/index.json', true).catch(() => null),
      getJson<{ paragraphs: number }>('ccc/index.json', true).catch(() => null),
      loadTracks().catch(() => []),
    ]);
    const tracksOfLesson = new Map<string, string[]>();
    for (const t of tracks) for (const l of t.levels) for (const s of l.steps) {
      const lid = s.kind === 'inapp' && s.type === 'lesson' ? s.id : s.kind === 'drill' && (s.source.type as string) === 'lesson' ? s.source.id : undefined;
      if (!lid) continue;
      const a = tracksOfLesson.get(lid) ?? [];
      if (!a.includes(t.id)) a.push(t.id);
      tracksOfLesson.set(lid, a);
    }
    const chains = new Map<string, { title: string; to: string }>();
    for (const [type, modes] of Object.entries(CHAIN_MODES)) for (const m of modes) {
      for (const c of await loadChains(m).catch(() => [])) { const k = `${type}:${c.id}`; if (!chains.has(k)) chains.set(k, { title: c.title, to: `${MODES[m].path}/${c.id}` }); }
    }
    return {
      edition: 'webc', cccMax: ccc?.paragraphs ?? 2865,
      apolTopics: new Map((apol?.topics ?? []).map((t) => [t.id, t.title])),
      works: new Map((lib?.works ?? []).map((w) => [w.id, w.title])),
      tracks: new Map(tracks.map((t) => [t.id, t.title])), tracksOfLesson, chains,
    };
  })();
  return knownP;
}

const GROUPS: { kind: FurtherLink['kind'][]; title: string }[] = [
  { kind: ['scripture'], title: 'Read the passage' },
  { kind: ['catechism'], title: 'The Catechism' },
  { kind: ['track', 'chain', 'apologetics'], title: 'Questions and arguments' },
  { kind: ['library'], title: 'In the Reading room' },
];

/** A short "Go further" list: only places in this app that this lesson's own data names. */
export function GoFurther({ lesson, extras }: { lesson: LessonLike; extras?: ExtrasLike | null }) {
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const ed = get(s.defaultEdition) ?? editions[0];
  const [known, setKnown] = useState<Known | null>(null);
  useEffect(() => { let live = true; loadKnown().then((k) => live && setKnown(k)).catch(() => undefined); return () => { live = false; }; }, []);
  const key = (extras?.tracks ?? []).map((t) => t.id).join(',') + '|' + (extras?.debate ?? []).map((d) => d.type + d.id).join(',');
  const links = useMemo(() => known ? buildGoFurther(lesson, known, extras, ed ? (r) => readerPath(ed, convertRef('kjv', 'vulgate', r).ref) : undefined).links : [], [known, lesson.id, key, ed?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!links.length) return null;
  return (
    <div className="lp-gofurther" aria-label="Go further">
      <h3 className="lp-ask">Go further</h3>
      {GROUPS.map((g) => {
        const items = links.filter((l) => g.kind.includes(l.kind));
        return items.length ? <p key={g.title} className="small"><strong>{g.title}:</strong> {items.map((l, i) => <span key={l.kind + l.to}>{i ? ' · ' : ''}<Link to={l.to}>{l.label.replace(/^(Read |Track: |Questions about the faith: |Read in the Reading room: )/, '')}</Link></span>)}</p> : null;
      })}
    </div>
  );
}

/** After a lesson is done: keep its verse in the memorize list, where it comes back on the usual spaced schedule. */
export function ReviewCard({ lesson, done }: { lesson: LessonLike; done: boolean }) {
  const toast = useToast();
  const kv = useMemo(() => keyVerseRef(lesson), [lesson.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const id = kv ? refId(kv.ref) : '';
  const have = useLiveQuery(() => (id ? db.memory.where('ref').equals(id).count() : 0), [id]) ?? 0;
  if (!done || !kv) return null;
  const add = async () => {
    if (await db.memory.where('ref').equals(id).count()) return;
    await db.memory.add({ ref: id, ...newCard(), createdAt: Date.now() });
    toast(`${formatRef(kv.ref)} added to Memorize.`, 'info');
  };
  return (
    <aside className="lp-review card" aria-label="Review later">
      <h3 className="lp-ask">Keep it fresh</h3>
      <p className="small">{lesson.mem}</p>
      {have ? <p className="small"><strong>In your memorize list.</strong> <Link to="/memorize">Review it there</Link>; it comes back a little later each time you recall it.</p>
        : <button type="button" className="btn small primary" onClick={() => void add()}>Add {kv.label} to my review</button>}
    </aside>
  );
}
