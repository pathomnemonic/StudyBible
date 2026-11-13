import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cachedBooksOf } from '../../data/loader';
import { CANON_SIZE } from '../../lib/canon';

/** What of this translation works without a connection, read from what is actually saved on the device. */
export default function OfflineLine({ edition, name }: { edition: string; name: string }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => { let live = true; cachedBooksOf(edition).then((b) => live && setN(b.length)); return () => { live = false; }; }, [edition]);
  if (n === null) return null;
  const all = n >= CANON_SIZE;
  return (
    <p className={`offline-line small${all ? ' ok' : ''}`} role="status">
      {all ? <>Offline: all {CANON_SIZE} books of {name} are saved on this device.</>
        : n > 0 ? <>Offline: {n} of {CANON_SIZE} books of {name} are saved, the ones you have opened. The rest need a connection. <Link to="/downloads">Save the whole translation</Link></>
        : <>Offline: {name} is not saved on this device yet, so it needs a connection. <Link to="/downloads">Save it for offline</Link></>}
    </p>
  );
}
