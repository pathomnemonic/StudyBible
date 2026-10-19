import { useEffect, useState } from 'react';
import Modal from './Modal';
import type { EditionRecord } from '../data/loader';
import { formatRef, type Ref } from '../lib/refs';
import { anchorChapterText, anchorToNative } from '../lib/bibleText';
import { bookAlignmentNote } from '../lib/versification';

interface Row {
  edition: EditionRecord;
  verses: { label: string; text: string }[];
  native: string;
  caveat?: string;
}

/** The same passage in every available translation, with each edition's own numbering shown. */
export default function CompareModal({ refs, editions, onClose }: { refs: Ref[]; editions: EditionRecord[]; onClose: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const ref = refs[0];
  useEffect(() => {
    let live = true;
    (async () => {
      const out: Row[] = [];
      for (const e of editions) {
        const at = await anchorChapterText(e, ref.book, ref.c1);
        const verses: Row['verses'] = [];
        const to = ref.c1 === ref.c2 ? (ref.v2 ?? 999) : 999;
        for (const [v, x] of [...at.verses.entries()].sort((a, b) => a[0] - b[0])) {
          if (v >= (ref.v1 ?? 1) && v <= to && verses.length < 12) verses.push({ label: x.native, text: x.text });
        }
        const n = anchorToNative(e, ref);
        const cav = bookAlignmentNote(e.scheme, ref.book) ?? at.verses.get(ref.v1 ?? 1)?.note;
        out.push({ edition: e, verses, native: formatRef({ ...ref, c1: n.chapter, c2: n.chapter, v1: n.v1, v2: n.v2 ?? n.v1 }), caveat: cav });
      }
      if (live) setRows(out);
    })();
    return () => {
      live = false;
    };
  }, [ref.book, ref.c1, ref.v1, ref.v2]);
  return (
    <Modal title={`Compare: ${formatRef(ref)}`} onClose={onClose}>
      {!rows && <p className="muted">Loading…</p>}
      {rows?.map((r) => (
        <div key={r.edition.id} className="card">
          <div className="row between">
            <strong>{r.edition.name}</strong>
            <span className="chip">{r.native}</span>
          </div>
          {r.verses.length === 0 && <p className="muted">No corresponding text found in this edition for this passage.</p>}
          {r.verses.map((v, i) => (
            <p key={i} lang={r.edition.language} style={{ fontFamily: 'var(--font-serif)' }}>
              <sup style={{ color: 'var(--accent)', fontWeight: 600 }}>{v.label}</sup> {v.text}
            </p>
          ))}
          {r.caveat && <div className="notice">{r.caveat}</div>}
        </div>
      ))}
    </Modal>
  );
}
