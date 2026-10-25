import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../data/loader';

type Index = Record<string, Record<string, Record<string, number>>>;
let cache: Promise<Index> | null = null;
const loadIndex = () => (cache ??= getJson<Index>('library/cite-index.json', true).then((x) => x ?? {}).catch(() => ({})));

const AUTHORS: [RegExp, string][] = [
  [/^(?:St\.|S\.|Saint)\s+(?:Augustine|Augustin|Aug\.)/, 'augustine'],
  [/^(?:St\.|S\.|Saint)\s+(?:Chrysostom|Chrys\.)|^Chrysostom/, 'chrysostom'],
  [/^(?:St\.|S\.|Saint)\s+Jerome|^Jerome/, 'jerome'],
  [/^(?:St\.|S\.|Saint)\s+Ambrose/, 'ambrose'],
  [/^(?:St\.|S\.|Saint)\s+Gregory(?:\s+the\s+Great)?/, 'gregory-great'],
  [/^(?:St\.|S\.|Saint)\s+Basil/, 'basil-the-great'],
  [/^(?:St\.|S\.|Saint)\s+Cyril/, 'cyril-jerusalem'],
  [/^(?:St\.|S\.|Saint)\s+Athanasius/, 'athanasius'],
  [/^(?:St\.|S\.|Saint)\s+Leo(?:\s+the\s+Great)?/, 'leo-great'],
  [/^(?:St\.|S\.|Saint)\s+Cyprian/, 'cyprian'],
  [/^(?:St\.|S\.|Saint)\s+Ephrem/, 'ephrem'],
  [/^(?:St\.|S\.|Saint)\s+(?:Irenæus|Irenaeus)/, 'irenaeus'],
  [/^(?:St\.|S\.|Saint)\s+Justin/, 'justin'],
  [/^(?:St\.|S\.|Saint)\s+Thomas(?:\s+Aquinas)?/, 'thomas-aquinas'],
  [/^(?:St\.|S\.|Saint)\s+(?:John\s+Damascene|Damascene)/, 'john-damascus'],
  [/^Origen/, 'origen'],
  [/^Tertullian/, 'tertullian'],
  [/^Eusebius/, 'eusebius'],
  [/^Lactantius/, 'lactantius'],
];
const START = /(?:St\.|S\.|Saint)\s+[A-Z][a-zæ]+|Origen|Tertullian|Eusebius|Lactantius|Chrysostom/g;
const CITE = /^[^.;\n]{0,22}?\b(hom|tract|ep|epist|serm|ser)\.\s+(\d{1,3})\b(?:\s+in\s+([A-Za-z0-9. ]{2,10}))?/;
const BOOK_WORK: Record<string, string> = { MAT: 'chrys-matthew', JHN: 'chrys-john', ACT: 'chrys-acts', ROM: 'chrys-romans', '1CO': 'chrys-1cor', '2CO': 'chrys-2cor', EPH: 'chrys-eph', PHP: 'chrys-phil', COL: 'chrys-col', '1TH': 'chrys-1th', '2TH': 'chrys-2th', '1TI': 'chrys-1tim', '2TI': 'chrys-2tim', TIT: 'chrys-titus', PHM: 'chrys-phlm', HEB: 'chrys-hebrews' };
const IN_BOOK: [RegExp, string][] = [[/^Matt/i, 'MAT'], [/^(Joan|John)/i, 'JHN'], [/^Act/i, 'ACT'], [/^Rom/i, 'ROM'], [/^1\s*Cor/i, '1CO'], [/^2\s*Cor/i, '2CO'], [/^Eph/i, 'EPH'], [/^Phil/i, 'PHP'], [/^Col/i, 'COL'], [/^Heb/i, 'HEB']];

function work(author: string, kind: string, hint?: string, inBook?: string): string | undefined {
  const k = kind === 'epist' ? 'ep' : kind === 'ser' ? 'serm' : kind;
  if (author === 'augustine') return k === 'tract' ? 'aug-tractates-john' : k === 'ep' ? 'aug-letters' : undefined;
  if (author === 'jerome') return k === 'ep' ? 'jerome-letters' : undefined;
  if (author === 'cyprian') return k === 'ep' ? 'cyprian' : undefined;
  if (author === 'gregory-great') return k === 'ep' ? 'gregory-letters' : undefined;
  if (author === 'leo-great') return k === 'ep' || k === 'serm' ? 'leo-sermons-letters' : undefined;
  if (author === 'chrysostom' && k === 'hom') {
    const b = inBook ? IN_BOOK.find(([re]) => re.test(inBook.trim()))?.[1] : hint;
    return b ? BOOK_WORK[b] : undefined;
  }
  return undefined;
}

/** Shows commentary text with the saints it names made clickable: "St. Augustine, tract. 26" opens that tractate; a bare name opens the reading room at his works. */
export function Cited({ text, hint }: { text: string; hint?: string }) {
  const [idx, setIdx] = useState<Index | null>(null);
  useEffect(() => { loadIndex().then(setIdx); }, []);
  if (!idx || !text) return <>{text}</>;
  const out: ReactNode[] = [];
  let at = 0;
  START.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = START.exec(text))) {
    const rest = text.slice(m.index);
    const a = AUTHORS.find(([re]) => re.test(rest));
    if (!a) continue;
    const name = (a[0].exec(rest) ?? [''])[0];
    const afterName = text.slice(m.index + name.length);
    const c = CITE.exec(afterName);
    let to = `/study/fathers?author=${a[1]}`;
    let end = m.index + name.length;
    let title = 'Read this Father’s works in the reading room';
    if (c) {
      const w = work(a[1], c[1], hint, c[3]);
      const kind = c[1] === 'epist' ? 'ep' : c[1] === 'ser' ? 'serm' : c[1];
      const sec = w ? idx[w]?.[kind]?.[c[2]] : undefined;
      if (w && sec !== undefined) {
        to = `/study/works/${w}/${sec}`;
        end = m.index + name.length + c[0].length;
        title = 'Read this passage in context';
      }
    }
    if (m.index > at) out.push(text.slice(at, m.index));
    out.push(<Link key={m.index} className="cite" to={to} title={title}>{text.slice(m.index, end)}</Link>);
    at = end;
    START.lastIndex = end;
  }
  if (at < text.length) out.push(text.slice(at));
  return <>{out.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}


/** A library excerpt with the place the verse is cited marked (the ingest wraps it in ⟦ ⟧). */
export function Marked({ text, hint }: { text: string; hint?: string }) {
  if (!text.includes('⟦')) return <Cited text={text} hint={hint} />;
  const parts = text.split(/(⟦[^⟧]*⟧)/);
  return (
    <>
      {parts.map((t, i) => (t.startsWith('⟦') ? <mark key={i} className="cite-hit">{t.slice(1, -1)}</mark> : t ? <Cited key={i} text={t} hint={hint} /> : null))}
    </>
  );
}
export const unmark = (t: string) => t.replace(/[⟦⟧]/g, '');
