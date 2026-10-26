import type { ReactNode } from 'react';

/** Sources, copyright notes and disclaimers at the end of a page: one quiet line that opens, instead of a paragraph hanging under the content. */
export default function FinePrint({ title = 'Sources and notes', children }: { title?: string; children: ReactNode }) {
  return <details className="fineprint"><summary>{title}</summary><p>{children}</p></details>;
}
