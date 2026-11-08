import { Mqtt, brokers } from '../../live/mqtt';

/** One shared connection to the public message relays for the together pages. Everything sent through it is sealed by the caller. */
let shared: Mqtt | null = null;
export function relay(): Mqtt {
  if (!shared || shared.state === 'closed') { try { shared?.close(); } catch { /* closed */ } shared = new Mqtt(brokers()); }
  return shared;
}

type Wild = { prefix: string; fn: (topic: string, payload: Uint8Array) => void };
const patched = new WeakMap<Mqtt, Set<Wild>>();
const dec = new TextDecoder();

/** Listen to every topic one level below `prefix` (the filter `prefix/+`); retained messages arrive on subscribing. Put back after a reconnect. */
export function subscribeLevel(mq: Mqtt, prefix: string, fn: Wild['fn']): () => void {
  let set = patched.get(mq);
  if (!set) {
    const s = new Set<Wild>();
    set = s; patched.set(mq, s);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = mq as any;
    const orig = m.handle.bind(m) as (first: number, body: Uint8Array) => void;
    m.handle = (first: number, body: Uint8Array) => {
      orig(first, body);
      if (first >> 4 !== 3) return;
      const tl = (body[0] << 8) | body[1];
      const topic = dec.decode(body.slice(2, 2 + tl));
      const off = 2 + tl + (((first >> 1) & 3) ? 2 : 0);
      for (const w of s) if (topic.startsWith(`${w.prefix}/`) && !topic.slice(w.prefix.length + 1).includes('/')) w.fn(topic, body.slice(off));
    };
  }
  const w = { prefix, fn };
  set.add(w);
  const off = mq.subscribe(`${prefix}/+`, () => undefined);
  return () => { set!.delete(w); off(); };
}
