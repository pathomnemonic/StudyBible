import { useEffect, useState } from 'react';

/** True while the media query matches (updates as the window changes). */
export function useMedia(query: string): boolean {
  const [m, setM] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    const q = matchMedia(query);
    const f = () => setM(q.matches);
    q.addEventListener('change', f);
    f();
    return () => q.removeEventListener('change', f);
  }, [query]);
  return m;
}
