import { useEffect, useRef, useState } from 'react';
import type { LiveContent, LiveSettings, LiveView } from './types';

const BASE: string = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '';

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers: { 'Content-Type': 'application/json', 'X-StudyBible': '1' }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch { throw new Error('Could not reach the server. Check your connection.'); }
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Live sessions need the Study Bible server; this copy of the app has none.'); }
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status}).`);
  return data as T;
}

export const live = {
  create: (content: LiveContent, settings: Partial<LiveSettings>) => call<{ code: string; hostKey: string; view: LiveView }>('POST', '/api/live/create', { content, settings }),
  join: (code: string, name: string, token?: string) => call<{ id: string; token: string; code: string; title: string }>('POST', '/api/live/join', { code, name, token }),
  peek: (code: string) => call<{ title: string; phase: string; locked: boolean }>('GET', `/api/live/${code}/peek`),
  host: (code: string, key: string, action: string, arg?: unknown) => call<{ ok: boolean }>('POST', `/api/live/${code}/host`, { key, action, arg }),
  answer: (code: string, token: string, value: unknown) => call<{ ok: boolean }>('POST', `/api/live/${code}/answer`, { token, value }),
  exportUrl: (code: string, key: string) => `${BASE}/api/live/${code}/export?key=${encodeURIComponent(key)}`,
  eventsUrl: (code: string, who: { key?: string; token?: string }) => `${BASE}/api/live/${code}/events?${who.key ? `key=${encodeURIComponent(who.key)}` : `token=${encodeURIComponent(who.token ?? '')}`}`,
};

/** The live state of a session, kept up to date by the server pushing it. */
export function useLive(code: string, who: { key?: string; token?: string }) {
  const [view, setView] = useState<LiveView | null>(null);
  const [state, setState] = useState<'connecting' | 'live' | 'lost' | 'gone'>('connecting');
  const offset = useRef(0);
  useEffect(() => {
    let es: EventSource | null = null, stopped = false, tries = 0;
    const open = () => {
      es = new EventSource(live.eventsUrl(code, who));
      es.onmessage = (e) => { const v = JSON.parse(e.data) as LiveView; offset.current = v.now - Date.now(); tries = 0; setView(v); setState('live'); };
      es.onerror = () => {
        setState('lost');
        // a closed stream is retried by the browser; if the session is gone for good the server answers 404 and we stop
        es?.close();
        if (stopped) return;
        tries++;
        live.peek(code).then(() => { if (!stopped) setTimeout(open, Math.min(5000, 800 * tries)); }, () => { if (!stopped) setState('gone'); });
      };
    };
    open();
    return () => { stopped = true; es?.close(); };
  }, [code, who.key, who.token]);
  return { view, state, serverNow: () => Date.now() + offset.current };
}

/** Seconds left until a deadline given by the server's clock. */
export function useCountdown(deadline: number | undefined, serverNow: () => number) {
  const [, tick] = useState(0);
  useEffect(() => { if (!deadline) return; const id = setInterval(() => tick((n) => n + 1), 200); return () => clearInterval(id); }, [deadline]);
  return deadline ? Math.max(0, (deadline - serverNow()) / 1000) : 0;
}

const ADJ = ['Joyful', 'Faithful', 'Brave', 'Humble', 'Gentle', 'Patient', 'Bright', 'Zealous', 'Merry', 'Steady', 'Hopeful', 'Radiant', 'Loyal', 'Fearless', 'Cheerful', 'Mighty'];
const NOUN = ['Pilgrim', 'Shepherd', 'Disciple', 'Lamb', 'Dove', 'Lion', 'Crusader', 'Apostle', 'Scribe', 'Fisherman', 'Gardener', 'Monk', 'Lantern', 'Eagle', 'Psalmist', 'Acolyte'];
export const randomName = () => `${ADJ[Math.floor(Math.random() * ADJ.length)]} ${NOUN[Math.floor(Math.random() * NOUN.length)]}`;
