import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BOOKS } from '../../lib/canon';
import { languageOf, loadLexicon, loadText, parseGreek, parseHebrew, type LexEntry, type Word } from '../../study/original';

type Verses = Awaited<ReturnType<typeof loadText>>;
const shortGloss = (g: string) => { const t = g.split(/[;,(:]/)[0].trim(); return t.length > 30 ? `${t.slice(0, 28)}…` : t; };
const clean = (w: string) => w.replace(/[⸀⸁⸂⸃⸄⸅]/g, '');

/** One chapter in the original language, word by word: the Greek or Hebrew, how it sounds, a short gloss, and on tap the grammar and dictionary entry. */
export default function InterlinearPage() {
  const { book = 'JHN', chapter = '1' } = useParams();
  const nav = useNavigate();
  const lang = languageOf(book) ?? 'grc';
  const meta = BOOKS.find((b) => b.id === book);
  const [text, setText] = useState<Verses | null | undefined>(undefined);
  const [lex, setLex] = useState<Record<string, LexEntry> | null>(null);
  const [sel, setSel] = useState<{ w: Word; v: number } | null>(null);
  useEffect(() => { setText(undefined); setSel(null); loadText(lang, book).then((t) => setText(t ?? null)); loadLexicon(lang).then(setLex); }, [book, lang]);
  const c = Math.max(1, +chapter || 1);
  const verses = text ? text[c - 1] : undefined;
  const picks = useMemo(() => BOOKS.filter((b) => languageOf(b.id)), []);
  const rtl = lang === 'hbo';
  const entry = sel && lex ? lex[sel.w[1]] : undefined;

  return (
    <div className="page interlinear">
      <h1>Original language, word by word</h1>
      <p className="lede">The Greek New Testament and the Hebrew Bible, one chapter at a time. Tap a word for its grammar and dictionary entry. The English under each word is a short dictionary gloss, not a translation of the verse.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
        <label>Book<select value={book} onChange={(e) => nav(`/study/interlinear/${e.target.value}/1`)}>{picks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label>Chapter<select value={c} onChange={(e) => nav(`/study/interlinear/${book}/${e.target.value}`)}>{Array.from({ length: text?.length ?? 1 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
        <Link className="btn small" to={`/read/webc/${book}/${c}`}>Read {meta?.name} {c} in English</Link>
      </div>
      {text === undefined && <p className="muted" role="status">Loading the original text…</p>}
      {text === null && <p className="notice" role="alert">The original-language text for this book is not on this device yet. Save the study data in Downloads, or connect and try again.</p>}
      {text && !verses && <p className="muted">This book has no chapter {c}.</p>}
      {rtl && verses && <p className="muted small">Hebrew is read from right to left. The Hebrew verse numbers can differ from the English in places (in the Psalms, for example, the title often counts as verse 1).</p>}
      {verses?.map((words, vi) => (
        <section key={vi} className="il-verse" aria-label={`Verse ${vi + 1}`}>
          <span className="il-n">{vi + 1}</span>
          <div className="il-words" dir={rtl ? 'rtl' : 'ltr'} lang={rtl ? 'he' : 'grc'}>
            {words.map((w, wi) => {
              const e = lex?.[w[1]];
              const on = sel?.v === vi && sel.w === w;
              return (
                <button key={wi} className={`il-w${on ? ' on' : ''}`} onClick={() => setSel(on ? null : { w, v: vi })} aria-pressed={on}>
                  <span className="il-o">{clean(w[0])}</span>
                  <span className="il-t" dir="ltr">{e?.[1] ?? ''}</span>
                  <span className="il-g" dir="ltr">{e ? shortGloss(e[2]) : (w[3] ?? '')}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {sel && (
        <aside className="il-detail card" aria-label="Word details" role="region">
          <div className="row between"><strong lang={rtl ? 'he' : 'grc'} style={{ fontSize: '1.4em' }}>{clean(sel.w[0])}</strong><button className="btn small ghost" onClick={() => setSel(null)}>Close</button></div>
          <p className="small"><strong>Grammar:</strong> {rtl ? parseHebrew(sel.w[2]) : parseGreek(sel.w[2])}</p>
          {entry ? (
            <>
              <p className="small"><strong>Dictionary form:</strong> <span lang={rtl ? 'he' : 'grc'}>{entry[0]}</span> ({entry[1]}) · Strong’s {rtl ? 'H' : 'G'}{sel.w[1]}</p>
              <p className="small"><strong>Means:</strong> {entry[2]}</p>
              {entry[3] && <p className="small"><strong>Rendered in the King James Version as:</strong> {entry[3]}</p>}
              {entry[4] && <p className="small muted">{entry[4]}</p>}
            </>
          ) : <p className="small muted">{sel.w[3] ? `Dictionary form: ${sel.w[3]}. ` : ''}This word has no dictionary entry in the app’s lexicon.</p>}
        </aside>
      )}
      <p className="muted small">Greek: SBL Greek New Testament (CC BY 4.0) with MorphGNT analysis (CC BY-SA 3.0). Hebrew: Westminster Leningrad Codex (public domain) with OSHB lemmas and morphology (CC BY 4.0). Glosses: Strong’s dictionary entries. See <Link to="/study/sources">Sources</Link>.</p>
    </div>
  );
}
