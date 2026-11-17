/** A row of segments for "question 3 of 7": finished ones filled, the current one lit. Decoration only; the text beside it says the same. */
export default function QuizPips({ at, total }: { at: number; total: number }) {
  return <div className="qpips" aria-hidden="true">{Array.from({ length: total }, (_, i) => <i key={i} className={i < at ? 'done' : i === at ? 'now' : ''} />)}</div>;
}
