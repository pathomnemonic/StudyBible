import { useEffect, useState } from 'react';
import { loadLexicon, originalFor, parseGreek, parseHebrew, type LexEntry, type OriginalResult, type Word } from '../study/original';
import type { Ref } from '../lib/refs';
import { useEditions } from '../data/EditionsContext';
import { languageLinks } from '../study/languageTools';
import { convertRef } from '../lib/versification';

const clean = (s: string) => s.replace(/[.,;:··!?"“”‘’()[\]]/g, '');

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
          <p className="small">
            {languageLinks(ref.book, kj.c1, kj.v1 ?? 1).map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" style={{ marginRight: 12 }}>{l.label} ↗</a>
            ))}
          </p>
        </div>
      )}
      <p className="muted small" style={{ marginTop: 12 }}>
        Data: SBLGNT (CC BY 4.0) with MorphGNT parsing (CC BY-SA 3.0); Open Scriptures Hebrew Bible, WLC text (public domain) with lemma and morphology (CC BY 4.0); Strong’s dictionaries, Open Scriptures edition (CC BY-SA).
      </p>
    </div>
  );
}
