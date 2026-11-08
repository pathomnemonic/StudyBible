import { open as unseal, seal, topicRoot } from '../../live/crypt';
import type { Mqtt } from '../../live/mqtt';
import { relay } from './net';
import { mergeGuesses, lost, board, type Guess } from './merge';

/**
 * A host-less room for solving a daily word together. Anyone with the six-digit code can join; every guess is a small sealed message on one
 * shared topic, and each device merges what it hears with mergeGuesses, so all boards agree. The room changes with the day (a new puzzle each day).
 */
export const newRoomCode = () => String(100000 + Math.floor(Math.random() * 900000));
export interface Member { id: string; name: string; seen: number }
type Msg = { t: 'p'; id: string; name: string } | { t: 'x'; id: string } | { t: 'g'; g: Guess } | { t: 's'; g: Guess[] } | { t: 'q' };
const rid = () => Math.random().toString(36).slice(2, 12);
export const ALIVE_MS = 20_000;

export interface CoopRoom {
  code: string; id: string;
  guesses(): Guess[]; members(): Member[]; state(): Mqtt['state'];
  guess(word: string): void; leave(): void; close(): void;
  subscribe(fn: () => void): () => void;
}

export async function joinRoom(code: string, name: string, day: number, answer: string, cap = 6, mq: Mqtt = relay()): Promise<CoopRoom> {
  const key = `coop:${code}:${day}`;
  const root = await topicRoot(key);
  const topic = `${root}/m`, keep = `${root}/s`;
  const id = rid();
  let all: Guess[] = [], closed = false, nm = name;
  const mine: Guess[] = [];
  const who = new Map<string, Member>();
  const fns = new Set<() => void>();
  const emit = () => { for (const f of fns) f(); };
  const send = async (m: Msg, retain = false, t = topic) => { if (!closed || m.t === 'x') mq.publish(t, await seal(key, m), retain); };
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => { if (all.length) void send({ t: 's', g: all }, true, keep); }, 400); };

  const take = (gs: Guess[]) => {
    const before = JSON.stringify(all);
    all = mergeGuesses(all, gs, cap);
    if (JSON.stringify(all) === before) return;
    // my guess lost its row to someone else's at the same moment: put it in the next free row
    const rows = board(all, answer, cap);
    for (const g of mine.splice(0)) {
      if (!lost(g, all)) { mine.push(g); continue; }
      if (g.i < rows.length && rows.length < cap && !rows.some((r) => r.w === answer)) {
        const again = { ...g, i: rows.length, ts: Date.now() };
        mine.push(again); all = mergeGuesses(all, [again], cap); void send({ t: 'g', g: again });
      }
    }
    save(); emit();
  };
  const handle = async (payload: Uint8Array) => {
    const m = await unseal<Msg>(key, payload);
    if (!m || closed) return;
    if (m.t === 'g' && m.g) take([m.g]);
    else if (m.t === 's' && Array.isArray(m.g)) take(m.g);
    else if (m.t === 'p' && typeof m.id === 'string') { who.set(m.id, { id: m.id, name: String(m.name ?? '').slice(0, 20), seen: Date.now() }); emit(); }
    else if (m.t === 'x') { who.delete(m.id); emit(); }
    else if (m.t === 'q' && all.length) setTimeout(() => void send({ t: 's', g: all }), Math.random() * 500);
  };
  const offs = [mq.subscribe(topic, (p) => void handle(p)), mq.subscribe(keep, (p) => void handle(p))];
  const beat = () => { void send({ t: 'p', id, name: nm }); who.set(id, { id, name: nm, seen: Date.now() }); emit(); };
  let tick = 0;
  const timer = setInterval(() => { beat(); if (++tick % 3 === 0 && all.length) void send({ t: 's', g: all }); }, 6000);
  const hello = () => { beat(); void send({ t: 'q' }); };
  mq.ready().then(hello, () => undefined);
  setTimeout(hello, 1500); // the first message can go out before the relay's subscription is in place
  who.set(id, { id, name: nm, seen: Date.now() });

  const close = () => { if (closed) return; closed = true; clearInterval(timer); clearTimeout(saveTimer); for (const o of offs) o(); who.delete(id); emit(); };
  return {
    code, id,
    guesses: () => all,
    members: () => [...who.values()].filter((m) => Date.now() - m.seen < ALIVE_MS).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)),
    state: () => mq.state,
    guess(word) {
      const rows = board(all, answer, cap);
      if (rows.length >= cap || rows.some((r) => r.w === answer)) return;
      const g: Guess = { i: rows.length, w: word, by: id, name: nm, ts: Date.now() };
      mine.push(g); take([g]);
      void send({ t: 'g', g }); setTimeout(() => void send({ t: 'g', g }), 1500);
    },
    leave() { void send({ t: 'x', id }); setTimeout(close, 50); },
    close,
    subscribe(fn) { fns.add(fn); return () => { fns.delete(fn); }; },
  };
}
