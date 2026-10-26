import { useEffect, useState } from 'react';
import { rejoin, resumeHost, type HostLink, type LinkState, type PlayerLink } from './link';

function useTick(link: { subscribe(fn: () => void): () => void } | null) {
  const [, force] = useState(0);
  useEffect(() => (link ? link.subscribe(() => force((n) => n + 1)) : undefined), [link]);
}

/** The teacher's connection to a session: it survives moving between pages, and a reload picks the session up again. */
export function useHostLink(code: string) {
  const [link, setLink] = useState<HostLink | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let off = false;
    setLink(null); setMissing(false);
    Promise.resolve(resumeHost(code)).then((l) => { if (off) return; if (l) setLink(l); else setMissing(true); }, () => { if (!off) setMissing(true); });
    return () => { off = true; };
  }, [code]);
  useTick(link);
  const state: LinkState = link ? link.state : missing ? 'gone' : 'connecting';
  return { link, view: link?.view ?? null, state, serverNow: link?.serverNow ?? (() => Date.now()) };
}

/** A student's connection to a session. */
export function usePlayerLink(code: string, token: string) {
  const [link, setLink] = useState<PlayerLink | null>(null);
  useEffect(() => {
    let off = false, made: PlayerLink | null = null;
    if (!token) return;
    Promise.resolve(rejoin(code, token)).then((l) => { made = l; if (off) l.close(); else setLink(l); });
    return () => { off = true; made?.close(); };
  }, [code, token]);
  useTick(link);
  return { link, view: link?.view ?? null, state: (link ? link.state : 'connecting') as LinkState, serverNow: link?.serverNow ?? (() => Date.now()) };
}
