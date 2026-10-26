import { useEffect, useState } from 'react';

/** How far up from the bottom of the screen a fixed bar must sit to clear the audio player, which is only sometimes there and not always at the very bottom. */
export function useDock(): number | undefined {
  const [b, setB] = useState<number | undefined>(undefined);
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector('.player');
      const tabs = document.querySelector('.tabs');
      const wide = window.matchMedia('(min-width: 900px)').matches;
      const base = wide ? 0 : tabs ? Math.round(tabs.getBoundingClientRect().height) : 0;
      if (!el) return setB(undefined);
      const top = el.getBoundingClientRect().top;
      setB(top < window.innerHeight ? Math.max(base, Math.round(window.innerHeight - top)) : undefined);
    };
    measure();
    const t = window.setInterval(measure, 500);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => { window.clearInterval(t); window.removeEventListener('scroll', measure, true); window.removeEventListener('resize', measure); };
  }, []);
  return b;
}
