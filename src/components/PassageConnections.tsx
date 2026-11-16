import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from '../lib/live';
import { db } from '../db/db';
import { formatRef, refId, type Ref } from '../lib/refs';
import { builtinPlans, type PlanDef } from '../plans/builtin';
import { useEditions } from '../data/EditionsContext';
import { getJson } from '../data/loader';
import { getLibScripture, getLibraryIndex } from '../data/content';
import { lookupTerm } from '../data/glossary';
import { loadTerms, makeMatcher, type TermBrief } from '../study/terms';
import type { Profile, ProfileFile } from '../lib/profiles';
import { collectionsOnPassage, glossaryIn, libraryCitations, notesOnPassage, plansOnPassage, profilesOnPassage, type LibCite, type WorkCites } from '../lib/passageBacklinks';

const snip = (s: string | undefined, n = 48) => ((s ?? '').trim().split('\n')[0] || 'Untitled').slice(0, n);

/** Everything in the app that points at this passage, and the pages that can take it further. Each group appears only when there is something in it. */
export default function PassageConnections({ r, text }: { r: Ref; text: string }) {
  const { get } = useEditions();
  const vulgate = get('vulgate');
  const notes = useLiveQuery(() => db.notes.toArray(), []);
  const cols = useLiveQuery(() => db.collections.toArray(), []);
  const userPlans = useLiveQuery(() => db.userPlans.toArray(), []);
  const [built, setBuilt] = useState<PlanDef[]>([]);
  const [cites, setCites] = useState<{ works: WorkCites[]; titles: Record<string, string> } | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [terms, setTerms] = useState<TermBrief[]>([]);
  const key = refId(r);
  useEffect(() => { if (vulgate) void builtinPlans(vulgate).then(setBuilt).catch(() => undefined); }, [vulgate?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    let live = true;
    setCites(null);
    (async () => {
      const [entries, lib] = await Promise.all([getLibScripture(r.book), getLibraryIndex()]);
      const works = libraryCitations((entries ?? []) as LibCite[], r);
      const titles: Record<string, string> = {};
      for (const w of lib?.works ?? []) titles[w.id] = `${w.title}${w.author ? `, ${w.author}` : ''}`;
      if (live) setCites({ works, titles });
    })().catch(() => live && setCites({ works: [], titles: {} }));
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    getJson<ProfileFile>('profiles/profiles.json', true).then((f) => f && setProfiles(f.profiles)).catch(() => undefined);
    loadTerms().then(setTerms).catch(() => undefined);
  }, []);

  const myNotes = useMemo(() => notesOnPassage(notes ?? [], r), [notes, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const myCols = useMemo(() => collectionsOnPassage(cols ?? [], r), [cols, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const plans = useMemo(() => plansOnPassage([...built, ...(userPlans ?? []).map((p) => ({ id: `user:${p.id}`, name: p.name, days: p.days }))], r), [built, userPlans, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const people = useMemo(() => profilesOnPassage(profiles, r), [profiles, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const gloss = useMemo(() => glossaryIn(text, lookupTerm), [text]);
  const keyWords = useMemo(() => {
    if (!text || !terms.length) return [];
    const ids = [...new Set(makeMatcher(terms, false).find(text).map((m) => m.id))];
    return ids.map((id) => terms.find((t) => t.id === id)!).filter(Boolean).slice(0, 10);
  }, [text, terms]);

  const p = encodeURIComponent(key);
  const tools: [string, string][] = [['Compare translations', `/study/compare-translations?ref=${p}`], ['The Fathers on this passage', `/study/fathers-on?ref=${p}`], ['Who quoted this', `/study/quotations?ref=${p}`], ['Across the centuries', `/study/conversation?ref=${p}`]];
  const none = cites !== null && [myNotes.length, myCols.length, plans.length, cites.works.length, people.length, gloss.length, keyWords.length].every((n) => n === 0);
  return (
    <section className="card pc" aria-label="Connected to this passage" data-testid="passage-connections">
      <h2 className="card-title">Connected to this passage</h2>
      <p className="muted small">What in the app points at {formatRef(r)}, worked out from your own records and the app’s data when you open this page.</p>
      {none && <p className="muted small">Nothing in your notes, collections, plans or the library points at this passage yet.</p>}
      {myNotes.length > 0 && <p className="small"><strong>Your notes</strong> ({myNotes.length}): {myNotes.slice(0, 6).map((n, i) => <span key={n.id}>{i ? ', ' : ''}<Link to={`/library/notes/${n.id}`}>{snip(n.title || n.body)}</Link></span>)}{myNotes.length > 6 ? '…' : ''}</p>}
      {myCols.length > 0 && <p className="small"><strong>Your collections</strong>: {myCols.map((c, i) => <span key={c.collection.id}>{i ? ', ' : ''}<Link to={`/collection/${c.collection.id}`}>{c.collection.name}</Link></span>)}</p>}
      {plans.length > 0 && <p className="small"><strong>Reading plans</strong>: {plans.slice(0, 6).map((x, i) => <span key={x.id}>{i ? ', ' : ''}<Link to={`/pray/plans/${encodeURIComponent(x.id)}`}>{x.name}</Link> <span className="muted">(day {x.days.slice(0, 3).join(', ')}{x.days.length > 3 ? '…' : ''})</span></span>)}{plans.length > 6 ? '…' : ''}</p>}
      {cites && cites.works.length > 0 && (
        <div className="small"><strong>Cited in the library</strong> ({cites.works.length} {cites.works.length === 1 ? 'work' : 'works'}):
          <ul className="list" style={{ margin: '4px 0' }}>
            {cites.works.slice(0, 6).map((w) => <li key={w.workId}><Link to={`/study/works/${w.workId}/${w.sections[0]}`}>{cites.titles[w.workId] ?? w.workId}</Link> <span className="muted">{w.sections.length} {w.sections.length === 1 ? 'section' : 'sections'}</span></li>)}
          </ul>
          {cites.works.length > 6 && <span className="muted">and {cites.works.length - 6} more; “The Fathers on this passage” lists them.</span>}
        </div>
      )}
      {people.length > 0 && <p className="small"><strong>People and places</strong>: {people.slice(0, 8).map((x, i) => <span key={`${x.kind}:${x.id}`}>{i ? ', ' : ''}<Link to={`/study/profile/${x.kind}/${x.id}`}>{x.name}</Link></span>)}</p>}
      {gloss.length > 0 && <p className="small"><strong>Glossary words in this text</strong>: {gloss.map((g, i) => <span key={g.term}>{i ? ', ' : ''}<Link to={`/study/glossary?t=${encodeURIComponent(g.term)}`}>{g.term}</Link></span>)}</p>}
      {keyWords.length > 0 && <p className="small"><strong>Key words and phrases</strong>: {keyWords.map((t, i) => <span key={t.id}>{i ? ', ' : ''}<Link to={`/study/term/${t.id}`}>{t.title}</Link></span>)}</p>}
      <div className="vl-tools" role="group" aria-label="Study tools for this passage"><span className="muted small">Study tools</span> <span className="vl-chips">{tools.map(([t, to]) => <Link key={to} className="chip" to={to}>{t}</Link>)}</span></div>
    </section>
  );
}
