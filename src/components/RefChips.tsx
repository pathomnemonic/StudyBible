import RefLink from './RefLink';
import { refsFromText } from '../study/refData';
import { refId } from '../lib/refs';

/** "Matthew 13:1-23; Mark 4:1-20" → clickable references that open in the reader. */
export default function RefChips({ text }: { text: string }) {
  const refs = refsFromText(text);
  return (
    <>
      {refs.map((r, i) => (
        <span key={refId(r) + i} className="chip" style={{ marginRight: 4 }}>
          <RefLink refv={r} />
        </span>
      ))}
    </>
  );
}
