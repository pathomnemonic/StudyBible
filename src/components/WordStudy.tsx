import { useEffect, useMemo, useState } from 'react';
import { loadLexicon, originalFor, parseGreek, parseHebrew, type LexEntry, type OriginalResult, type Word } from '../study/original';
import type { Ref } from '../lib/refs';
import { useEditions } from '../data/EditionsContext';
import { languageLinks } from '../study/languageTools';
import { BOOKS } from '../lib/canon';
import { Link } from 'react-router-dom';
import { loadText, languageOf } from '../study/original';
import { convertRef } from '../lib/versification';

const clean = (s: string) => s.replace(/[.,;:··!?"“”‘’()[\]]/g, '');


const canSpeak = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

const plain = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f\u0591-\u05c7]/g, '').replace(/[ς]/g, 'σ').replace(/[^\p{L}]/gu, '').toLowerCase();
const lev = (a: string, b: string) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
type Rec = { start(): void; stop(): void; lang: string; interimResults: boolean; maxAlternatives: number; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
const Recognition: (new () => Rec) | undefined = typeof window !== 'undefined' ? (window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition : undefined;

/** Hear the word slowly or at speed, see how to say it, and (where the browser allows) say it back and see how close you were. */
function Pronounce({ word, say, rtl }: { word: string; say?: string; rtl: boolean }) {
  const lang = rtl ? 'he-IL' : 'el-GR';
  const [state, setState] = useState<'idle' | 'listening' | 'result' | 'error'>('idle');
  const [score, setScore] = useState(0);
  const [heard, setHeard] = useState('');
  useEffect(() => { setState('idle'); }, [word]);
  const hear = (rate: number) => {
    try {
      const u = new SpeechSynthesisUtterance(word.replace(/[,.;·]/g, ''));
      u.lang = lang;
      u.rate = rate;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch { /* no speech */ }
  };
  const listen = () => {
    if (!Recognition) return;
    const r = new Recognition();
    r.lang = lang;
    r.interimResults = false;
    r.maxAlternatives = 3;
    setState('listening');
    r.onresult = (e) => {
      const alts = [...Array.from(e.results[0])].map((a) => a.transcript);
      const target = plain(word);
      let best = 0;
      let text = alts[0] ?? '';
      for (const a of alts) {
        const p = plain(a);
        const sc = 1 - lev(p, target) / Math.max(p.length, target.length, 1);
        if (sc > best) { best = sc; text = a; }
      }
      setHeard(text);
      setScore(Math.max(0, Math.round(best * 100)));
      setState('result');
    };
    r.onerror = () => setState('error');
    r.onend = () => setState((s) => (s === 'listening' ? 'error' : s));
    try { r.start(); } catch { setState('error'); }
  };
  return (
    <div style={{ margin: '4px 0' }}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {canSpeak && <button className="btn small" onClick={() => hear(0.9)} aria-label="Hear this word">Hear it</button>}
        {canSpeak && <button className="btn small" onClick={() => hear(0.45)} aria-label="Hear this word slowly">Slowly</button>}
        {Recognition && <button className="btn small" onClick={listen} disabled={state === 'listening'}>{state === 'listening' ? 'Listening…' : 'Say it'}</button>}
        {say && <span className="muted small">Say it: <em>{say}</em></span>}
      </div>
      {state === 'result' && <p className="small" role="status" style={{ margin: '4px 0' }}>I heard “{heard}”: about {score}% of the letters match. Speech recognition for {rtl ? 'Hebrew' : 'Greek'} is made for the modern language, so treat this as a rough guide.</p>}
      {state === 'error' && <p className="muted small" role="status" style={{ margin: '4px 0' }}>Could not hear you. Check that the microphone is allowed and try again.</p>}
      {!canSpeak && !Recognition && <p className="muted small">This browser cannot speak or listen. The transliteration above is a guide.</p>}
    </div>
  );
}

/** Counts a word's appearances book by book, by reading the original-language text of every book on demand. */
function WordJourney({ strongs, lang }: { strongs: string; lang: 'grc' | 'hbo' }) {
  const [rows, setRows] = useState<{ id: string; name: string; n: number; first?: [number, number] }[] | null>(null);
  const [done, setDone] = useState(0);
  const books = BOOKS.filter((b) => languageOf(b.id) === lang);
  useEffect(() => {
    setRows(null);
    setDone(0);
  }, [strongs, lang]);
  const run = async () => {
    const out: NonNullable<typeof rows> = [];
    setRows([]);
    let k = 0;
    const queue = [...books];
    const worker = async () => {
      while (queue.length) {
        const b = queue.shift()!;
        const t = await loadText(lang, b.id).catch(() => null);
        let n = 0;
        let first: [number, number] | undefined;
        t?.forEach((ch, ci) => (ch ?? []).forEach((vs, vi) => { const c = (vs ?? []).filter((w) => w[1] === strongs).length; if (c) { n += c; first ??= [ci + 1, vi + 1]; } }));
        out.push({ id: b.id, name: b.name, n, first });
        setDone(++k);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    setRows(out.sort((a, b) => books.findIndex((x) => x.id === a.id) - books.findIndex((x) => x.id === b.id)));
  };
  const max = Math.max(1, ...(rows ?? []).map((r) => r.n));
  const total = (rows ?? []).reduce((a, r) => a + r.n, 0);
  return (
    <div style={{ marginTop: 8 }}>
      {rows === null ? (
        <button className="btn small" onClick={run}>Trace this word through {lang === 'grc' ? 'the New Testament' : 'the Old Testament'}</button>
      ) : done < books.length ? (
        <p className="muted small">Reading {done} of {books.length} books…</p>
      ) : (
        <>
          <p className="small"><strong>{total}</strong> appearance{total === 1 ? '' : 's'} in {rows.filter((r) => r.n).length} book{rows.filter((r) => r.n).length === 1 ? '' : 's'}. Choose a book to read where it first appears.</p>
          <div className="wordjourney" role="list">
            {rows.filter((r) => r.n).map((r) => (
              <Link key={r.id} role="listitem" className="wj-row" to={`/read/dra/${r.id}/${r.first![0]}`} title={`${r.name}: ${r.n}`}>
                <span className="wj-name">{r.name}</span>
                <span className="wj-bar"><i style={{ width: `${Math.max(3, (r.n / max) * 100)}%` }} /></span>
                <span className="wj-n">{r.n}</span>
              </Link>
            ))}
          </div>
          <p className="muted small">Counts are of the same Strong’s number, so related forms of one word are included. Chapter numbers follow the Hebrew or Greek text and may differ by a chapter from your translation in a few Psalms.</p>
        </>
      )}
    </div>
  );
}

const STOP = new Set('3588 2532 1722 1473 4771 846 1510 1161 3739 3756 235 3754 1519 1537 1909 575 3326 4314 5037 3767 1063 3361 2443 3778 1565 5100 5101 1487 302 3303 2228 5613 3844 5228 1223 2596 3825 3568 3752 1893 3362 3364 3777 3761 3588 3956 853 834 413 5921 518 3808 1961 3605 5973 4480 3588 1992 1931 1992 1931 2088 2063 3588'.split(' '));
const FUNCTION_WORD = /\b(article|conjunction|preposition|particle|pronoun|negative|prefix|sign of|adverb|interjection)\b/i;

/** The words that keep returning in the chapter being read: a fingerprint of what it is about. */
function ChapterEchoes({ book, chapter, lang, lex }: { book: string; chapter: number; lang: 'grc' | 'hbo'; lex: Record<string, LexEntry> | null }) {
  const [rows, setRows] = useState<{ s: string; n: number; verses: number[] }[] | null>(null);
  useEffect(() => {
    let live = true;
    setRows(null);
    loadText(lang, book).then((t) => {
      const ch = t?.[chapter - 1];
      if (!ch || !live) return setRows([]);
      const m = new Map<string, { n: number; verses: Set<number> }>();
      ch.forEach((vs, vi) => (vs ?? []).forEach((w) => {
        if (!w[1]) return;
        const e = m.get(w[1]) ?? { n: 0, verses: new Set<number>() };
        e.n++;
        e.verses.add(vi + 1);
        m.set(w[1], e);
      }));
      setRows([...m.entries()].filter(([k, v]) => v.n >= 3 && v.verses.size >= 2 && !STOP.has(k) && !(lex?.[k] && FUNCTION_WORD.test(lex[k][2].slice(0, 90)))).map(([s, v]) => ({ s, n: v.n, verses: [...v.verses] })).sort((a, b) => b.n - a.n).slice(0, 8));
    });
    return () => { live = false; };
  }, [book, chapter, lang, lex]);
  if (!rows || !rows.length || !lex) return null;
  return (
    <details style={{ marginTop: 14 }}>
      <summary>Words that keep returning in this chapter</summary>
      <ul className="echo-words">
        {rows.map((r) => {
          const e = lex[r.s];
          return (
            <li key={r.s}>
              <span lang={lang === 'hbo' ? 'he' : 'grc'} style={{ fontSize: '1.15rem' }}>{e?.[0]}</span> <span className="muted small">{e?.[1]} · {e?.[2].split(/[;,(]/)[0].trim().slice(0, 30)}</span>
              <span className="small"> — {r.n}× (vv. {r.verses.slice(0, 10).join(', ')}{r.verses.length > 10 ? '…' : ''})</span>
            </li>
          );
        })}
      </ul>
      <p className="muted small">Counted by Strong’s number in the Hebrew or Greek text; small function words are left out. A word that returns is not always the point of the chapter, but it often marks a theme.</p>
    </details>
  );
}

const renderings = (kjv: string) => [...new Set(kjv.replace(/\([^)]*\)/g, '').split(/[,;]/).map((x) => x.trim().toLowerCase().replace(/^(x|to|be|a|an|the)\s+/, '')).filter((x) => x && !/^\d/.test(x)))];

/** Words in the selected verses that English translators have rendered many different ways: places where one translation's choice is only one option. */
function BlindSpots({ verses, lex, lang }: { verses: { label: string; words: Word[] }[]; lex: Record<string, LexEntry> | null; lang: 'grc' | 'hbo' }) {
  const rows = useMemo(() => {
    if (!lex) return [];
    const seen = new Map<string, { s: string; n: string[]; where: Set<string> }>();
    for (const v of verses) for (const w of v.words) {
      const e = w[1] ? lex[w[1]] : null;
      if (!e || !w[1] || STOP.has(w[1]) || !e[3]) continue;
      const n = renderings(e[3]);
      if (n.length < 6) continue;
      const cur = seen.get(w[1]) ?? { s: w[1], n, where: new Set<string>() };
      cur.where.add(v.label.replace(/^.*?(\d+)$/, '$1'));
      seen.set(w[1], cur);
    }
    return [...seen.values()].sort((a, b) => b.n.length - a.n.length).slice(0, 5);
  }, [verses, lex]);
  if (!rows.length || !lex) return null;
  return (
    <div className="notice" style={{ marginTop: 12 }}>
      <strong>Where an English choice hides a range</strong>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {rows.map((r) => (
          <li key={r.s} className="small">
            <span lang={lang === 'hbo' ? 'he' : 'grc'} style={{ fontSize: '1.05rem' }}>{lex[r.s][0]}</span> ({lex[r.s][1]}): the KJV alone renders it {r.n.length} ways, such as {r.n.slice(0, 5).join(', ')}. Compare translations before resting an argument on one English word.
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Word-by-word Greek or Hebrew for the selected verses, with Strong's-based glosses and parsing. */
export default function WordStudy({ refs }: { refs: Ref[] }) {
  const { editions } = useEditions();
  const ref = refs[0];
  const [res, setRes] = useState<OriginalResult | null | undefined>(undefined);
  const [lex, setLex] = useState<Record<string, LexEntry> | null>(null);
  const [sel, setSel] = useState<{ w: Word; label: string } | null>(null);
  const english = editions.find((e) => e.scheme === 'english');

  useEffect(() => {
    let live = true;
    setRes(undefined);
    setSel(null);
    originalFor(ref, english).then((r) => live && setRes(r));
    return () => {
      live = false;
    };
  }, [ref.book, ref.c1, ref.v1, ref.c2, ref.v2, english?.id]);
  useEffect(() => {
    if (res) loadLexicon(res.lang).then(setLex);
  }, [res?.lang]);

  if (res === undefined) return <div className="skeleton" style={{ height: 80 }} />;
  if (res === null)
    return (
      <div className="empty">
        This book has no Hebrew or Greek text in the app (deuterocanonical books survive in Greek or Latin and are not included). Passage links for the protocanon are in the Context tab.
      </div>
    );
  const rtl = res.lang === 'hbo';
  const kj = convertRef('vulgate', 'kjv', { ...ref, c2: ref.c1, v2: ref.v1 ?? 1 }).ref;
  const entry = sel && sel.w[1] && lex ? lex[sel.w[1]] : null;
  return (
    <div>
      <p className="muted small" style={{ marginTop: 0 }}>
        {rtl ? 'Hebrew (Westminster Leningrad Codex, Open Scriptures Hebrew Bible)' : 'Greek (SBL Greek New Testament, MorphGNT)'}. Click a word. Glosses are Strong’s dictionary entries, a concordance aid, not a translation; many words have a range of meaning.
      </p>
      {res.note && <div className="notice">{res.note}</div>}
      {res.verses.map((v) => (
        <div key={v.label} style={{ margin: '10px 0' }}>
          <div className="muted small">{v.label}</div>
          <div className={`wordrow${rtl ? ' rtl' : ''}`} lang={rtl ? 'he' : 'grc'} dir={rtl ? 'rtl' : 'ltr'}>
            {v.words.map((w, i) => {
              const e = w[1] && lex ? lex[w[1]] : null;
              return (
                <button key={i} className={`word${sel?.w === w ? ' on' : ''}`} onClick={() => setSel({ w, label: v.label })} dir="ltr">
                  <span className="orig" dir={rtl ? 'rtl' : 'ltr'}>{rtl ? w[0] : w[0]}</span>
                  <span className="gl">{e ? e[2].split(/[;,(]/)[0].trim().slice(0, 22) : w[3] ? clean(w[3]) : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {sel && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="row between">
            <strong lang={rtl ? 'he' : 'grc'} style={{ fontSize: '1.4rem' }}>{entry?.[0] ?? sel.w[3] ?? sel.w[0]}</strong>
            <button className="btn small ghost" onClick={() => setSel(null)}>Close</button>
          </div>
          {entry && <div className="muted">{entry[1]} · Strong’s {rtl ? 'H' : 'G'}{sel.w[1]}</div>}
          <Pronounce word={sel.w[0]} say={entry?.[1]} rtl={rtl} />
          <p className="small" style={{ margin: '6px 0' }}><strong>Form here:</strong> {rtl ? parseHebrew(sel.w[2]) : parseGreek(sel.w[2])}</p>
          {entry ? (
            <>
              <p style={{ margin: '6px 0' }}>{entry[2]}</p>
              {entry[3] && <p className="muted small"><strong>KJV renders it:</strong> {entry[3]}</p>}
              {entry[4] && <p className="muted small"><strong>Derivation:</strong> {entry[4]}</p>}
            </>
          ) : (
            <p className="muted small">No dictionary entry was matched for this word.</p>
          )}
          {sel.w[1] && <WordJourney strongs={sel.w[1]} lang={res.lang} />}
          <p className="small">
            {languageLinks(ref.book, kj.c1, kj.v1 ?? 1).map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" style={{ marginRight: 12 }}>{l.label} ↗</a>
            ))}
          </p>
        </div>
      )}
      <BlindSpots verses={res.verses} lex={lex} lang={res.lang} />
      <ChapterEchoes book={ref.book} chapter={kj.c1} lang={res.lang} lex={lex} />
      <p className="muted small" style={{ marginTop: 12 }}>
        Data: SBLGNT (CC BY 4.0) with MorphGNT parsing (CC BY-SA 3.0); Open Scriptures Hebrew Bible, WLC text (public domain) with lemma and morphology (CC BY 4.0); Strong’s dictionaries, Open Scriptures edition (CC BY-SA).
      </p>
    </div>
  );
}
