import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import { passageText } from '../lib/bibleText';
import { formatRef, parseRefId, parseRefs, type Ref } from '../lib/refs';
import { getJson } from '../data/loader';
import { liturgicalDay, parseIso } from '../liturgy/compute';
import { loadDaily, pickDaily, dailyRef, type DailyEntry } from '../study/daily';
import { drawDayCard, type DayCardSpec } from '../lib/dayCard/draw';
import { buildSpec, trimVerses, wordFor } from '../lib/dayCard/content';
import { pickArt, type ArtWork } from '../lib/dayCard/art';
import { ADVENT_ONLY, TAGLINES, pickTagline } from '../lib/dayCard/taglines';
import { useToast } from '../components/Toast';

const localIso = () => new Date().toLocaleDateString('en-CA');
const SIZES: Record<string, { label: string; w: number; h: number }> = { portrait: { label: 'Portrait', w: 1080, h: 1350 }, square: { label: 'Square', w: 1080, h: 1080 }, story: { label: 'Story', w: 1080, h: 1920 } };
const KEY = 'sb:cardart:v1';
type Picks = Record<string, string | number>;
const readPicks = (): Picks => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Picks; } catch { return {}; } };
const writePicks = (p: Picks) => { try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(Object.entries(p).sort().slice(-200)))); } catch { /* private mode */ } };
const bookCache = new Map<string, string | null>();
const bookOf = (name: string) => { if (!bookCache.has(name)) { const p = parseRefs(`${name} 1`); bookCache.set(name, p.ok ? p.refs[0].ref.book : null); } return bookCache.get(name)!; };
const loadImage = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => rej(new Error('image')); i.src = src; });

/** One click: today's card (the Today screen's content over a painting), ready to share. The same drawing code makes the day's social post. Drawn on your device; nothing is uploaded. */
export default function DayCardPage() {
  const [params] = useSearchParams();
  const [s] = useSettings();
  const { get } = useEditions();
  const toast = useToast();
  const today = localIso();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get('d') ?? '') ? params.get('d')! : today;
  const ld = useMemo(() => liturgicalDay(parseIso(date), s.diocese === 'US' ? 'usa' : 'universal'), [date, s.diocese]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [base, setBase] = useState<{ spec: DayCardSpec; ref: Ref | null; saintMissing: boolean } | null>(null);
  const [art, setArt] = useState<ArtWork[]>([]);
  const [artId, setArtId] = useState<string | number | null | undefined>(undefined); // undefined: not chosen yet, null: plain colour
  const [skipped, setSkipped] = useState<(string | number)[]>([]);
  const [size, setSize] = useState('portrait');
  const [dim, setDim] = useState(64);
  const [showTag, setShowTag] = useState(true);
  const pool = useMemo(() => (ld.season === 'advent' ? [...TAGLINES, ...ADVENT_ONLY] : TAGLINES), [ld.season]);
  const [tagIx, setTagIx] = useState<number | null>(null); // null: the day's line in the rotation
  const [showCredit, setShowCredit] = useState(false);
  const [picker, setPicker] = useState(false);
  const [err, setErr] = useState('');

  // the day's content: the same pieces the Today screen carries
  useEffect(() => {
    let live = true;
    (async () => {
      const [file, a, b] = await Promise.all([loadDaily(), getJson<{ works: ArtWork[] }>('art.json', true), getJson<{ works: ArtWork[] }>('art-more.json', true)]);
      if (!live) return;
      setArt([...(a?.works ?? []), ...(b?.works ?? []).map((w) => ({ ...w, theme: w.theme || 'More paintings and engravings' }))]);
      const entry: DailyEntry | null = file ? pickDaily(file, ld) : null;
      const word = wordFor(date);
      const ref: Ref | null = word ? parseRefId(word.ref) : entry ? dailyRef(entry) : null;
      const dra = get('dra') ?? get(s.defaultEdition);
      if (!ref || !dra) return setErr('Today’s verse is not available on this device yet.');
      const vs = await passageText(dra, ref, 12);
      const v = trimVerses(vs.map((x) => [x.v, x.text] as [number, string]), ref.v1 ?? 1, ref.v2 ?? ref.v1 ?? 999);
      if (!v) return setErr('Today’s verse is not available on this device yet.');
      const label = formatRef({ ...ref, v1: v.first, v2: v.last }, { noDual: true });
      const lect = await getJson<{ days: Record<string, { r: Record<string, string> }> }>(`lectionary/${date.slice(0, 4)}.json`, true);
      const c = lect?.days[date]?.r;
      const { spec, issues } = buildSpec({
        date, dayName: ld.dayName, color: ld.color, verse: { text: v.text, label }, saint: entry?.saint, word: word?.word,
        question: word ? word.question : entry?.q, advent: ld.season === 'advent',
        readings: c ? [c.first_reading, c.second_reading, c.gospel].filter(Boolean).join(' · ') : undefined,
      });
      setBase({ spec, ref, saintMissing: issues.length > 0 });
    })().catch(() => live && setErr('The card could not be prepared. Try again in a moment.'));
    return () => { live = false; };
  }, [date, ld.dayName, s.defaultEdition]);

  // the picture: the day's own pick if it has one, else the best fresh match; a user's choice is remembered for the day
  const hints = useMemo(() => base && ({ book: base.ref?.book, chapter: base.ref?.c1, words: [wordFor(date)?.word ?? '', base.spec.verse.text], saint: base.spec.father?.who, season: ld.season, seed: date }), [base, date, ld.season]);
  useEffect(() => {
    if (!hints || !art.length || artId !== undefined) return;
    const picks = readPicks();
    if (picks[date] !== undefined && art.some((w) => String(w.id) === String(picks[date]))) { setArtId(picks[date]); return; }
    const used = Object.entries(picks).filter(([d]) => d !== date).sort().map(([, id]) => id);
    const r = pickArt(art, hints, used, bookOf, 120);
    setArtId(r ? r.work.id : null);
    if (r) writePicks({ ...picks, [date]: r.work.id });
  }, [hints, art, artId, date]);
  const work = art.find((w) => String(w.id) === String(artId)) ?? null;
  const choose = (id: string | number | null) => { setArtId(id); const p = readPicks(); if (id === null) delete p[date]; else p[date] = id; writePicks(p); };
  const another = () => {
    if (!hints) return;
    const skip = [...skipped, ...(artId != null ? [artId] : [])];
    const picks = readPicks();
    const used = Object.entries(picks).filter(([d]) => d !== date).sort().map(([, id]) => id);
    const r = pickArt(art, hints, used, bookOf, 120, skip);
    if (r) { setSkipped(skip); choose(r.work.id); } else toast('No other matching picture. Use “Choose a picture”.');
  };

  const credit = showCredit && work ? `Picture: ${work.title}, ${work.artist}${work.date ? ', ' + work.date : ''}. ${work.credit}` : undefined;
  const spec: DayCardSpec | null = base && { ...base.spec, tagline: showTag ? pickTagline(date, tagIx, { advent: ld.season === 'advent' }) : undefined, credit };
  useEffect(() => {
    const c = canvas.current;
    if (!c || !spec || artId === undefined) return;
    let live = true;
    (async () => {
      let img: HTMLImageElement | null = null;
      if (work) { try { img = await loadImage(import.meta.env.BASE_URL + work.file); } catch { img = null; } }
      if (!live) return;
      const { w, h } = SIZES[size];
      c.width = w; c.height = h;
      drawDayCard(c.getContext('2d')!, w, h, spec, { img, dim });
    })();
    return () => { live = false; };
  }, [spec?.verse.text, spec?.tagline, spec?.credit, spec?.father?.text, spec?.question, work?.id, size, dim, artId]);

  const blob = () => new Promise<Blob | null>((res) => canvas.current?.toBlob(res, 'image/png'));
  const download = async () => { const b = await blob(); if (!b) return toast('The picture could not be saved.', 'error'); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `cathology-${date}.png`; a.click(); URL.revokeObjectURL(a.href); };
  const share = async () => {
    const b = await blob();
    if (!b) return;
    const file = new File([b], `cathology-${date}.png`, { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: base?.spec.dayName });
      else await download();
    } catch { /* cancelled */ }
  };
  const themes = [...new Set(art.map((a) => a.theme))];
  const [theme, setTheme] = useState('');
  const shown = art.filter((a) => !theme || a.theme === theme).slice(0, 96);

  return (
    <div className="page share-page">
      <h1>Today’s card</h1>
      {err && <p className="notice">{err}</p>}
      {!err && !spec && <p className="muted">Preparing the card…</p>}
      {spec && (
        <div className="share-grid">
          <div>
            <canvas ref={canvas} className="share-canvas" role="img" aria-label={`Card for ${spec.dateLine}: ${spec.verse.text} ${spec.verse.label}`} />
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn primary" onClick={download}>Download image</button>
              {'share' in navigator && <button className="btn" onClick={share}>Share…</button>}
              <button className="btn" onClick={another}>Another picture</button>
              <button className="btn" onClick={() => setPicker((x) => !x)} aria-expanded={picker}>Choose a picture</button>
            </div>
            {base?.saintMissing && <p className="muted small">This day has no checked saint quotation, so the card leaves it off.</p>}
            {work && <p className="muted small">{work.title}, {work.artist}{work.date ? `, ${work.date}` : ''}. {work.credit}.</p>}
          </div>
          <div className="share-controls">
            {picker && (
              <div className="field">
                <div className="chips" style={{ margin: '0 0 8px' }}>
                  <button className={'chip' + (!theme ? ' sel' : '')} onClick={() => setTheme('')}>All</button>
                  {themes.slice(0, 40).map((t) => <button key={t} className={'chip' + (theme === t ? ' sel' : '')} onClick={() => setTheme(t)}>{t}</button>)}
                </div>
                <div className="art-grid">
                  <button className={'art-thumb' + (artId === null ? ' on' : '')} onClick={() => choose(null)} aria-pressed={artId === null}>Plain colour</button>
                  {shown.map((a) => (
                    <button key={a.id} className={'art-thumb' + (String(artId) === String(a.id) ? ' on' : '')} onClick={() => choose(a.id)} aria-label={`${a.title}, ${a.artist}`} aria-pressed={String(artId) === String(a.id)}>
                      <img src={import.meta.env.BASE_URL + a.file} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="field"><span>Darken the picture for the words</span><input type="range" min={30} max={90} value={dim} onChange={(e) => setDim(+e.target.value)} aria-label="Darken the picture" /></label>
            <div className="field"><span>Shape</span><div className="chips">{Object.entries(SIZES).map(([k, v]) => <button key={k} aria-pressed={size === k} className={'chip' + (size === k ? ' sel' : '')} onClick={() => setSize(k)}>{v.label}</button>)}</div></div>
            <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={showTag} onChange={(e) => setShowTag(e.target.checked)} /> <span className="small">Show the line about the app at the bottom</span></label>
            {showTag && <div className="chips" aria-label="Line at the bottom">{pool.map((t, i) => <button key={t} className={'chip' + ((tagIx ?? pool.indexOf(pickTagline(date, null, { advent: ld.season === 'advent' }))) === i ? ' sel' : '')} onClick={() => setTagIx(i)}>{t}</button>)}</div>}
            <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={showCredit} onChange={(e) => setShowCredit(e.target.checked)} /> <span className="small">Add the picture’s credit in small print</span></label>
            <p className="muted small">Verse: Douay-Rheims (public domain). Mass readings are citations only. The card is made on your device; nothing is uploaded. <Link to="/share">Make a card for any verse</Link></p>
          </div>
        </div>
      )}
    </div>
  );
}
