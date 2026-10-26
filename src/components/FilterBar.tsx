import type { ReactNode } from 'react';

/** The search stays in view; every other control folds into one "Filters" button that shows how many are in use. */
export default function FilterBar({ search, active = 0, children, extra }: { search: ReactNode; active?: number; children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="filterbar">
      <div className="filterbar-top">{search}{extra}</div>
      <details>
        <summary>Filters{active > 0 && <span className="fb-count">{active}</span>}</summary>
        <div className="filterbar-body">{children}</div>
      </details>
    </div>
  );
}
