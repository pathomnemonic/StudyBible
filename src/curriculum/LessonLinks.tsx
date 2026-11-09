import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tracksFor, trackPath, type Track } from '../lib/apolTracks';
import { getChapterLinks, KIND_ICON, type VerseLink } from '../lib/verseLinks';
import { parseRefId } from '../lib/refs';

/** Where in an apologetics track a lesson or topic appears: the track and the exact level. */
const levelOf = (t: Track, type: string, id: string) => t.levels.find((l) => l.steps.some((s) => (s.kind === 'inapp' && s.type === type && s.id === id) || (s.kind === 'drill' && s.source.type === type && s.source.id === id)));

export function TrackLinks({ lessonId, topics }: { lessonId: string; topics: string[] }) {
  const [rows, setRows] = useState<{ t: Track; level: number; title: string; why: string }[]>([]);
  useEffect(() => {
    let live = true;
    Promise.all([tracksFor('lesson', lessonId).then((ts) => ts.map((t) => ({ t, key: ['lesson', lessonId] as const, why: 'This lesson is a step in' }))), ...topics.map((id) => tracksFor('apologetics', id).then((ts) => ts.map((t) => ({ t, key: ['apologetics', id] as const, why: 'Questions on this topic are a step in' }))))])
      .then((all) => {
        const seen = new Set<string>();
        const out: { t: Track; level: number; title: string; why: string }[] = [];
        for (const r of all.flat()) { const l = levelOf(r.t, r.key[0], r.key[1]); if (!l || seen.has(r.t.id)) continue; seen.add(r.t.id); out.push({ t: r.t, level: l.n, title: l.title, why: r.why }); }
        if (live) setRows(out.slice(0, 3));
      }).catch(() => undefined);
    return () => { live = false; };
  }, [lessonId, topics.join(',')]);
  if (!rows.length) return null;
  return <ul className="lp-tracks">{rows.map((r) => <li key={r.t.id}>{r.why} <Link to={trackPath(r.t.id)}>{r.t.title}</Link>, level {r.level}: {r.title}.</li>)}</ul>;
}

/** Other places in the app that deal with the same chapter: chains, lives, words, the Fathers. */
export function RelatedInApp({ refId }: { refId?: string }) {
  const [items, setItems] = useState<VerseLink[]>([]);
  useEffect(() => {
    let live = true;
    const r = refId ? parseRefId(refId) : null;
    if (!r) { setItems([]); return; }
    getChapterLinks(r.book, r.c1, undefined, 6).then((x) => live && setItems(x.items)).catch(() => undefined);
    return () => { live = false; };
  }, [refId]);
  if (!items.length) return null;
  return <><h4 className="lp-ask">Also in this app, on the same passage</h4><ul className="lp-related">{items.map((i) => <li key={i.kind + i.id}><Link to={i.route}>{KIND_ICON[i.kind]} {i.title}</Link>{i.why ? <span className="muted small"> {i.why}</span> : null}</li>)}</ul></>;
}
