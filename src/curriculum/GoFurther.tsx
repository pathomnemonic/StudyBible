import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getJson } from '../data/loader';
import { useEditions } from '../data/EditionsContext';
import { loadEditions } from '../data/loader';
import { useSettings } from '../lib/store';
import { useToast } from '../components/Toast';
import { refId, formatRef } from '../lib/refs';
import { addReviewCard } from './addReview';
import { loadKnownFrom, memoizeComplete, verifyWorks, type Loaders, type SourceName } from './knownLoad';
import { loadTracks } from '../lib/apolTracks';
import { loadChains } from '../chains/load';
import { MODES, type ChainMode } from '../chains/types';
import { buildGoFurther, keyVerse, refContext, type ExtrasLike, type FurtherLink, type Known, type LessonLike } from './goFurther';

/** What exists in the app, read from the same data files the pages use. Only a complete result is kept; a failed or partial one is retried. */
const CHAIN_MODES: Record<string, ChainMode[]> = { chain: ['arguments', 'development'], claim: ['claims'], heresy: ['heresies'], development: ['development'], words: ['words'] };
const loaders: Loaders = {
  apologetics: () => getJson('apologetics.json'),
  library: () => getJson('library/index.json'),
  catechism: () => getJson('ccc/index.json'),
  tracks: () => loadTracks(),
  editions: () => loadEditions().then((e) => e.editions),
  chains: async () => {
    const out: Record<string, { id: string; title: string; to: string }[]> = {};
    for (const [type, modes] of Object.entries(CHAIN_MODES)) for (const m of modes) {
      for (const c of await loadChains(m)) (out[type] ??= []).push({ id: c.id, title: c.title, to: `${MODES[m].path}/${c.id}` });
    }
    return out;
  },
};
export const loadKnownState = memoizeComplete(() => loadKnownFrom(loaders));
/** A library work is only offered when its data file can be read: false = absent, a thrown error = could not check. */
const workReadable = async (id: string) => (await getJson(`library/works/${id}.json`)) != null;

type Load = { status: 'loading' } | { status: 'complete' | 'partial' | 'failed'; known: Known; failed: SourceName[] };
const SOURCE_WORDS: Record<SourceName, string> = { apologetics: 'apologetics topics', library: 'the Reading room', catechism: 'the Catechism index', tracks: 'tracks', chains: 'debate chains', editions: 'Bible editions' };

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
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const roomIds = (lesson.deeper ?? []).filter((d) => d.startsWith('room:')).map((d) => d.slice(5));
  const roomKey = roomIds.join(',');
  useEffect(() => {
    let live = true;
    if (attempt > 0) setLoad({ status: 'loading' });
    loadKnownState().then(async (r) => {
      // the lesson's own library works are checked against their data files; a failure to check is a retryable failure
      const known = await verifyWorks(r.known, roomKey ? roomKey.split(',') : [], workReadable);
      const failed = [...new Set([...r.failed, ...(known.failed?.has('library') && !r.failed.includes('library') ? (['library'] as SourceName[]) : [])])];
      if (live) setLoad({ status: failed.length === 0 ? 'complete' : r.status === 'failed' ? 'failed' : 'partial', known, failed });
    }).catch(() => live && setLoad({ status: 'failed', known: { edition: 'webc', cccMax: 0, apolTopics: new Map(), works: new Map(), tracks: new Map(), tracksOfLesson: new Map(), chains: new Map(), failed: new Set(['apologetics', 'library', 'catechism', 'tracks', 'chains']) }, failed: ['apologetics', 'library', 'catechism', 'tracks', 'chains'] }));
    return () => { live = false; };
  }, [attempt, roomKey]);
  const key = (extras?.tracks ?? []).map((t) => t.id).join(',') + '|' + (extras?.debate ?? []).map((d) => d.type + d.id).join(',');
  const result = useMemo(() => {
    if (load.status === 'loading') return null;
    const ctx = ed ? refContext(editions, ed.id) : null;
    return buildGoFurther(lesson, load.known, extras, ctx);
  }, [load, lesson.id, key, ed?.id, editions.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!result || load.status === 'loading') return <div className="lp-gofurther" data-state="loading" aria-busy="true" />;
  const { links, unavailable } = result;
  const problem = load.status !== 'complete';
  if (!links.length && !unavailable.length && !problem) return null;
  return (
    <div className="lp-gofurther" aria-label="Go further" data-state={load.status}>
      <h3 className="lp-ask">Go further</h3>
      {GROUPS.map((g) => {
        const items = links.filter((l) => g.kind.includes(l.kind));
        return items.length ? <p key={g.title} className="small"><strong>{g.title}:</strong> {items.map((l, i) => <span key={l.kind + l.to}>{i ? ' · ' : ''}<Link to={l.to}>{l.label.replace(/^(Read |Track: |Questions about the faith: |Read in the Reading room: )/, '')}</Link>{l.note ? <span className="muted" data-note="approximate"> ({l.note})</span> : null}</span>)}</p> : null;
      })}
      {unavailable.length ? <p className="small muted" data-unavailable>{unavailable.map((u) => `${u.label}: ${u.reason}`).join('; ')}.</p> : null}
      {problem ? (
        <p className="small" role="status" data-load-problem>
          {load.status === 'failed' ? 'Links could not be loaded.' : `Some links could not be loaded (${load.failed.map((f) => SOURCE_WORDS[f]).join(', ')}).`}{' '}
          <button type="button" className="btn small" onClick={() => setAttempt((a) => a + 1)}>Try again</button>
        </p>
      ) : null}
    </div>
  );
}

/** After a lesson is done: keep its verse in the memorize list, where it comes back on the usual spaced schedule. */
export function ReviewCard({ lesson, done }: { lesson: LessonLike; done: boolean }) {
  const toast = useToast();
  const { editions } = useEditions();
  const kctx = useMemo(() => refContext(editions, editions[0]?.id ?? ''), [editions.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const kv = useMemo(() => keyVerse(lesson, kctx), [lesson.id, kctx]); // eslint-disable-line react-hooks/exhaustive-deps
  const id = kv.status === 'exact' || kv.status === 'approximate' ? refId(kv.ref) : '';
  const have = useLiveQuery(() => (id ? db.memory.where('ref').equals(id).count() : 0), [id]) ?? 0;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inflight = useRef(false);
  if (!done || kv.status === 'none') return null;
  if (kv.status === 'invalid')
    return (
      <aside className="lp-review card" aria-label="Review later" data-state="invalid">
        <h3 className="lp-ask">Keep it fresh</h3>
        <p className="small">{lesson.mem}</p>
        <p className="small muted">This verse cannot be added to your review automatically: {kv.reason}.</p>
      </aside>
    );
  const add = async () => {
    if (inflight.current) return;
    inflight.current = true;
    setBusy(true);
    setError('');
    try {
      const r = await addReviewCard(id, { sourceRef: refId(kv.original), sourceScheme: kv.sourceScheme, approximate: !kv.exact });
      if (r === 'added') toast(`${formatRef(kv.original)} added to Memorize.`, 'info');
    } catch (e) {
      setError(`Could not add it to your review (${e instanceof Error ? e.message : 'unknown error'}). Your lesson is still complete; try again.`);
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  };
  return (
    <aside className="lp-review card" aria-label="Review later" data-state={have ? 'added' : kv.exact ? 'ready' : 'approximate'}>
      <h3 className="lp-ask">Keep it fresh</h3>
      <p className="small">{lesson.mem}</p>
      {have ? <p className="small"><strong>In your memorize list.</strong> <Link to="/memorize">Review it there</Link>; it comes back a little later each time you recall it.</p>
        : kv.exact ? <button type="button" className="btn small primary" disabled={busy} aria-busy={busy} onClick={() => void add()}>{busy ? 'Adding…' : `Add ${kv.label} to my review`}</button>
        : <>
            <p className="small muted" data-note="approximate">{kv.label} is numbered differently in some editions, so we have not added it for you: {kv.reason}</p>
            <button type="button" className="btn small" disabled={busy} aria-busy={busy} onClick={() => void add()}>{busy ? 'Adding…' : `Add it anyway as ${formatRef(kv.ref)} (Vulgate numbering)`}</button>
          </>}
      {error ? <p className="small" role="alert" data-error>{error}</p> : null}
    </aside>
  );
}
