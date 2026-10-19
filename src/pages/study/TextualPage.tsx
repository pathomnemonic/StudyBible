import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getVariants, refsFromText, type Variant } from '../../study/refData';
import { useEditions } from '../../data/EditionsContext';
import { passageText } from '../../lib/bibleText';
import { formatRef, refId } from '../../lib/refs';
import RefChips from '../../components/RefChips';

/** Scripture textual history: places where manuscripts and ancient versions differ, with live text from the bundled editions side by side. */
export default function TextualPage() {
  const [sp, setSp] = useSearchParams();
  const [list, setList] = useState<Variant[]>([]);
  const { editions } = useEditions();
  const [filter, setFilter] = useState<'all' | 'NT' | 'OT'>('all');
  const [texts, setTexts] = useState<{ ed: string; label: string; text: string; lang: string }[]>([]);
  useEffect(() => {
    getVariants().then((d) => setList(d?.variants ?? []));
  }, []);
  const id = sp.get('v');
  const v = list.find((x) => x.id === id);
  useEffect(() => {
    if (!v) return setTexts([]);
    let live = true;
    const ref = refsFromText(v.refs)[0];
    Promise.all(
      editions.map(async (e) => ({ ed: e.shortName, label: e.name, lang: e.language, text: (await passageText(e, ref, 12).catch(() => [])).map((x) => x.text).join(' ') })),
    ).then((t) => live && setTexts(t));
    return () => {
      live = false;
    };
  }, [v?.id, editions.length]);
  return (
    <div className="page">
      <h1>Scripture textual history</h1>
      {!v ? (
        <>
          <p className="lede">Where the oldest manuscripts, the Greek and Hebrew texts, and the Latin Vulgate differ, and how that shows in the translations you can read here.</p>
          <div className="notice info">
            Manuscripts differ in small ways. The great majority of differences are spelling and word order and affect no doctrine. The Council of Trent received Scripture as read in the Church and in the Vulgate; in 1943 Pius XII’s <em>Divino Afflante Spiritu</em> encouraged study of the original-language texts and of textual criticism. This page is a study aid, written cautiously; check a critical edition before quoting manuscript details.
          </div>
          <div className="segmented" role="tablist" style={{ margin: '10px 0' }}>
            {(['all', 'NT', 'OT'] as const).map((k) => <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>{k === 'all' ? 'All' : k === 'NT' ? 'New Testament' : 'Old Testament'}</button>)}
          </div>
          <ul className="list">
            {list.filter((x) => filter === 'all' || x.kind === filter).map((x) => (
              <li key={x.id}><button className="linklike" onClick={() => setSp({ v: x.id })}><strong>{x.title}</strong></button> <span className="muted small">{x.refs}</span></li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="small"><button className="linklike" onClick={() => setSp({})}>← All variants</button></p>
          <h2>{v.title}</h2>
          <p><RefChips text={v.refs} /></p>
          <p className="lede">{v.summary}</p>
          <div className="card">
            <h3>Evidence</h3>
            <ul>{v.evidence.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
          {v.catholic && (
            <div className="card">
              <h3>For Catholic readers</h3>
              <p>{v.catholic}</p>
            </div>
          )}
          <div className="card">
            <h3>The passage in the bundled editions</h3>
            <p className="muted small">The first verse of {formatRef(refsFromText(v.refs)[0], { noDual: true })} is shown in each edition (verse numbers may differ between traditions). A missing passage in one edition may itself be the variant.</p>
            <div>
              {texts.map((t) => (
                <div key={t.ed} className="textual-row">
                  <strong>{t.ed}</strong>
                  <div lang={t.lang}>{t.text || <span className="muted">— (not present in this edition at this verse)</span>}</div>
                </div>
              ))}
            </div>
            <p className="small"><Link to={`/study/passage/${refId(refsFromText(v.refs)[0])}`}>Study this passage</Link></p>
          </div>
        </>
      )}
    </div>
  );
}
