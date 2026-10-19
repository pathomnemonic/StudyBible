import { Link } from 'react-router-dom';
import { formatRef, parseRefId, type Ref } from '../lib/refs';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import { readerPath } from '../lib/nav';

/** A scripture reference (anchor id or Ref) that opens in the reader in the user's chosen translation. */
export default function RefLink({ id, refv, children }: { id?: string; refv?: Ref; children?: React.ReactNode }) {
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const r = refv ?? (id ? parseRefId(id) : null);
  if (!r) return <>{id}</>;
  const ed = get(s.defaultEdition) ?? editions[0];
  return <Link to={readerPath(ed, r)}>{children ?? formatRef(r)}</Link>;
}
