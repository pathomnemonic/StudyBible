import { LiveRoom, sanitizeContent, sanitizeRoster, sanitizeSettings } from './engine';
import { open as unseal, seal, topicRoot } from './crypt';
import { Mqtt, brokers } from './mqtt';
import { live } from './client';
import type { LiveContent, LiveSettings, LiveView } from './types';

/**
 * Two ways to carry a class session.
 *  - peer to peer (the default): the teacher's own device runs the session and students reach it through a public message relay, with every
 *    message sealed by a key made from the class code. Needs no server of ours, so it works from any copy of the app.
 *  - the Study Bible server, when there is one: the server runs the session and everyone connects to it.
 */
export type LinkState = 'connecting' | 'live' | 'lost' | 'gone';
interface Base { code: string; via: 'p2p' | 'server'; view: LiveView | null; state: LinkState; subscribe(fn: () => void): () => void; serverNow(): number; close(): void }
export interface HostLink extends Base { key: string; act(action: string, arg?: unknown): Promise<void>; csv(): Promise<string> }
export interface PlayerLink extends Base { token: string; answer(value: unknown, q?: number): Promise<void>; submit(): Promise<void> }
export interface RoomInfo { title: string; phase: string; locked: boolean; mode: 'game' | 'exam' | 'race' | 'build'; roster: string[]; rosterOnly: boolean }

class Emitter {
  private fns = new Set<() => void>();
  subscribe(fn: () => void) { this.fns.add(fn); return () => { this.fns.delete(fn); }; }
  emit() { for (const f of this.fns) f(); }
}

let shared: Mqtt | null = null;
export function relay(): Mqtt { if (!shared || shared.state === 'closed') { try { shared?.close(); } catch { /* closed */ } shared = new Mqtt(brokers()); } return shared; }
const rid = () => Math.random().toString(36).slice(2, 12);

interface InMsg { t: 'peek' | 'join' | 'hello' | 'ans'; n?: string; name?: string; token?: string; value?: unknown; q?: number; submit?: boolean; mid?: string }

// ------------------------------------------------------------------ host, peer to peer
export const hosts = new Map<string, HostLink>();
const SNAP = (code: string) => `sb:live:snap:${code}`;

async function newCode(mq: Mqtt): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const code = String(100000 + Math.floor(Math.random() * 900000));
    const root = await topicRoot(code);
    const n = rid();
    const taken = await new Promise<boolean>((res) => {
      const off = mq.subscribe(`${root}/o/${n}`, () => { off(); res(true); });
      void seal(code, { t: 'peek', n }).then((p) => mq.publish(`${root}/in`, p));
      setTimeout(() => { off(); res(false); }, 1200);
    });
    if (!taken) return code;
  }
  throw new Error('Could not find a free class code. Try again.');
}

export async function hostP2P(content: LiveContent, settings: LiveSettings, roster: string[], resume?: string): Promise<HostLink> {
  const mq = relay();
  await mq.ready();
  const room = resume ? LiveRoom.restore(resume) : new LiveRoom(await newCode(mq), sanitizeContent(content), sanitizeSettings(settings), Date.now, sanitizeRoster(roster));
  const code = room.code;
  const root = await topicRoot(code);
  const em = new Emitter();
  const seen = new Set<string>();
  let lastVersion = -1, lastBeat = 0, closed = false;
  const link: HostLink = {
    code, key: room.hostKey, via: 'p2p', view: room.view('host'), state: mq.state === 'open' ? 'live' : 'connecting',
    subscribe: (f) => em.subscribe(f), serverNow: () => Date.now(),
    act: async (a, arg) => { room.host(a, arg); flush(); },
    csv: async () => room.csv(),
    close: () => { closed = true; clearInterval(timer); off(); void sendAll({ t: 'gone' }); try { localStorage.removeItem(SNAP(code)); } catch { /* storage unavailable */ } hosts.delete(code); link.state = 'gone'; em.emit(); },
  };
  const send = async (topic: string, data: unknown) => { mq.publish(topic, await seal(code, data)); };
  const sendAll = async (msg: unknown) => { for (const t of room.tokens()) await send(`${root}/p/${t}`, msg); };
  const pushPlayer = (t: string) => send(`${root}/p/${t}`, { t: 'view', view: room.view('player', t) });
  const flush = (force = false) => {
    if (closed) return;
    link.view = room.view('host');
    link.state = mq.state === 'open' ? 'live' : 'lost';
    if (force || room.version !== lastVersion) { lastVersion = room.version; for (const t of room.tokens()) void pushPlayer(t); try { localStorage.setItem(SNAP(code), room.snapshot()); } catch { /* storage unavailable */ } }
    em.emit();
  };
  const off = mq.subscribe(`${root}/in`, async (payload) => {
    const m = await unseal<InMsg>(code, payload);
    if (!m || closed) return;
    if (m.mid) { if (seen.has(m.mid)) return; seen.add(m.mid); if (seen.size > 2000) seen.clear(); }
    if (m.t === 'peek' && m.n) { await send(`${root}/o/${m.n}`, { title: room.content.title, phase: room.phase, locked: room.locked, mode: room.settings.mode, roster: room.rosterFree(), rosterOnly: room.roster.length > 0 && room.settings.rosterOnly }); }
    else if (m.t === 'join' && m.n) {
      try { const j = room.join(String(m.name ?? ''), typeof m.token === 'string' ? m.token : undefined); await send(`${root}/o/${m.n}`, { ok: true, ...j, title: room.content.title }); flush(); void pushPlayer(j.token); }
      catch (e) { await send(`${root}/o/${m.n}`, { err: (e as Error).message }); }
    } else if (m.t === 'hello' && m.token) { room.ping(m.token); if (room.playerByToken(m.token)) void pushPlayer(m.token); }
    else if (m.t === 'ans' && m.token) {
      if (room.settings.mode === 'exam' && m.submit) room.submit(m.token);
      else if (room.settings.mode === 'exam') room.examAnswer(m.token, Number(m.q), m.value);
      else if (room.settings.mode === 'race' || room.settings.mode === 'build') room.runAnswer(m.token, m.value);
      else room.answer(m.token, m.value);
      flush();
    }
  });
  const timer = setInterval(() => {
    room.tick();
    flush(Date.now() - lastBeat > 10_000 && ((lastBeat = Date.now()), true));
    room.touched = Math.max(room.touched, Date.now() - 1);
  }, 500);
  mq.onState = () => flush(true);
  try { localStorage.setItem(`sb:live:via:${code}`, 'p2p'); localStorage.setItem(SNAP(code), room.snapshot()); } catch { /* storage unavailable */ }
  hosts.set(code, link);
  flush(true);
  return link;
}

// ------------------------------------------------------------------ player, peer to peer
function request<T>(mq: Mqtt, code: string, root: string, msg: InMsg, ms: number): Promise<T> {
  return new Promise((res, rej) => {
    const n = rid();
    let done = false;
    const off = mq.subscribe(`${root}/o/${n}`, async (p) => { const r = await unseal<T>(code, p); if (r && !done) { done = true; off(); clearTimeout(t); res(r); } });
    const t = setTimeout(() => { if (!done) { done = true; off(); rej(new Error('No class answered to that code. Check the number, and that your teacher’s screen is still open.')); } }, ms);
    void seal(code, { ...msg, n }).then((p) => { if (!mq.publish(`${root}/in`, p)) { /* the relay is still connecting; the timeout reports it */ } });
    // the first message can be sent before the relay's subscription is in place; ask again shortly
    setTimeout(() => { if (!done) void seal(code, { ...msg, n }).then((p) => mq.publish(`${root}/in`, p)); }, 1500);
  });
}

async function peekP2P(code: string): Promise<RoomInfo> {
  const mq = relay(); await mq.ready();
  return request<RoomInfo>(mq, code, await topicRoot(code), { t: 'peek' }, 5000);
}

async function joinP2P(code: string, name: string, token?: string): Promise<PlayerLink> {
  const mq = relay(); await mq.ready();
  const root = await topicRoot(code);
  const r = await request<{ ok?: boolean; err?: string; token: string; id: string }>(mq, code, root, { t: 'join', name, token }, 8000);
  if (!r.ok) throw new Error(r.err ?? 'Could not join.');
  return playerP2P(code, r.token, mq, root);
}

export async function playerP2P(code: string, token: string, mq: Mqtt = relay(), rootIn?: string): Promise<PlayerLink> {
  await mq.ready().catch(() => undefined);
  const root = rootIn ?? await topicRoot(code);
  const em = new Emitter();
  let last = Date.now(), skew = 0, closed = false;
  const link: PlayerLink = {
    code, token, via: 'p2p', view: null, state: 'connecting', subscribe: (f) => em.subscribe(f), serverNow: () => Date.now() + skew,
    answer: async (value, q) => { const mid = rid(); const p = await seal(code, { t: 'ans', token, value, q, mid }); mq.publish(`${root}/in`, p); setTimeout(() => mq.publish(`${root}/in`, p), 1500); },
    submit: async () => { const mid = rid(); const p = await seal(code, { t: 'ans', token, submit: true, mid }); mq.publish(`${root}/in`, p); setTimeout(() => mq.publish(`${root}/in`, p), 1500); },
    close: () => { closed = true; clearInterval(timer); off(); },
  };
  const hello = async () => { mq.publish(`${root}/in`, await seal(code, { t: 'hello', token })); };
  const off = mq.subscribe(`${root}/p/${token}`, async (payload) => {
    const m = await unseal<{ t: string; view?: LiveView }>(code, payload);
    if (!m || closed) return;
    last = Date.now();
    if (m.t === 'gone') { link.state = 'gone'; em.emit(); return; }
    if (m.view) { skew = m.view.now - Date.now(); link.view = m.view; link.state = 'live'; em.emit(); }
  });
  mq.onState = (s) => { if (s === 'open') void hello(); else if (link.state === 'live') { link.state = 'lost'; em.emit(); } };
  const timer = setInterval(() => { if (!closed && link.state === 'live' && Date.now() - last > 35_000) { link.state = 'lost'; em.emit(); void hello(); } }, 5000);
  void hello();
  setTimeout(() => { if (!link.view && !closed) void hello(); }, 1500);
  return link;
}

// ------------------------------------------------------------------ the server's way of carrying a session
function serverLink<T extends Base>(code: string, who: { key?: string; token?: string }, extra: (l: Base) => Omit<T, keyof Base>): T {
  const em = new Emitter();
  let skew = 0, es: EventSource | null = null, stopped = false, tries = 0;
  const base: Base = { code, via: 'server', view: null, state: 'connecting', subscribe: (f) => em.subscribe(f), serverNow: () => Date.now() + skew, close: () => { stopped = true; es?.close(); } };
  const openStream = () => {
    es = new EventSource(live.eventsUrl(code, who));
    es.onmessage = (e) => { const v = JSON.parse(e.data) as LiveView; skew = v.now - Date.now(); tries = 0; base.view = v; base.state = 'live'; em.emit(); };
    es.onerror = () => { base.state = 'lost'; em.emit(); es?.close(); if (stopped) return; tries++; live.peek(code).then(() => { if (!stopped) setTimeout(openStream, Math.min(5000, 800 * tries)); }, () => { base.state = 'gone'; em.emit(); }); };
  };
  openStream();
  return Object.assign(base, extra(base)) as T;
}
export const hostServer = (code: string, key: string): HostLink => serverLink<HostLink>(code, { key }, () => ({ key, act: async (a, arg) => { await live.host(code, key, a, arg); }, csv: async () => (await fetch(live.exportUrl(code, key))).text() }));
export const playerServer = (code: string, token: string): PlayerLink => serverLink<PlayerLink>(code, { token }, () => ({ token, answer: async (v, q) => { await live.answer(code, token, v, q); }, submit: async () => { await live.submit(code, token); } }));

// ------------------------------------------------------------------ choosing
/** Start a class. Peer to peer first; the server only if the relay cannot be reached and there is one. */
export async function createHost(content: LiveContent, settings: LiveSettings, roster: string[]): Promise<HostLink> {
  try { return await hostP2P(content, settings, roster); }
  catch (e1) {
    try { const c = await live.create(content, settings, roster); try { localStorage.setItem(`sb:live:host:${c.code}`, c.hostKey); localStorage.setItem(`sb:live:via:${c.code}`, 'server'); } catch { /* storage unavailable */ } return hostServer(c.code, c.hostKey); }
    catch { throw new Error(`${(e1 as Error).message} Live sessions need an internet connection that allows secure web sockets (some school networks block them).`); }
  }
}
export function resumeHost(code: string): Promise<HostLink> | HostLink | null {
  const have = hosts.get(code);
  if (have) return have;
  try {
    const via = localStorage.getItem(`sb:live:via:${code}`);
    if (via === 'server') { const key = localStorage.getItem(`sb:live:host:${code}`); return key ? hostServer(code, key) : null; }
    const snap = localStorage.getItem(SNAP(code));
    if (snap) return hostP2P({ title: '', slides: [], questions: [] }, sanitizeSettings({}), [], snap);
  } catch { /* storage unavailable */ }
  return null;
}
export async function peekRoom(code: string): Promise<RoomInfo & { via: 'p2p' | 'server' }> {
  const viaServer = live.peek(code).then((p) => ({ ...p, via: 'server' as const }));
  const viaP2P = peekP2P(code).then((p) => ({ ...p, via: 'p2p' as const }));
  try { return await Promise.any([viaServer, viaP2P]); } catch { throw new Error('No class answered to that code. Check the number, and that your teacher’s screen is still open.'); }
}
export async function joinRoom(code: string, name: string, token?: string, via?: 'p2p' | 'server'): Promise<PlayerLink> {
  if (via !== 'p2p') {
    try { const j = await live.join(code, name, token); try { localStorage.setItem(`sb:live:via:${code}`, 'server'); } catch { /* storage unavailable */ } return playerServer(code, j.token); }
    catch (e) { if (via === 'server') throw e; if (/full|locked|already|class list|started|ended|taken/i.test((e as Error).message)) throw e; }
  }
  const p = await joinP2P(code, name, token);
  try { localStorage.setItem(`sb:live:via:${code}`, 'p2p'); } catch { /* storage unavailable */ }
  return p;
}
export function rejoin(code: string, token: string): PlayerLink | Promise<PlayerLink> {
  let via = 'p2p';
  try { via = localStorage.getItem(`sb:live:via:${code}`) ?? 'p2p'; } catch { /* storage unavailable */ }
  return via === 'server' ? playerServer(code, token) : playerP2P(code, token);
}
