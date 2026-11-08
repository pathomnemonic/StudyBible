import { open as unseal, seal, topicRoot } from '../../live/crypt';
import type { Mqtt } from '../../live/mqtt';
import { relay, subscribeLevel } from './net';
import { addPosts, cleanPosts, type Member, type Post } from './board';

/**
 * A group's weekly results. Each nickname owns one retained message per week, sealed with a key made from the group code. The relay keeps the
 * last retained message per topic, so someone who opens the page later still receives the week's posts. Leaving publishes an empty retained message.
 */
const keyOf = (group: string) => `grp:${group}`;
async function nickHash(nick: string) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nick.toLowerCase())));
  return [...h].slice(0, 6).map((x) => x.toString(16).padStart(2, '0')).join('');
}

export interface GroupBoard {
  members(): Member[]; state(): Mqtt['state'];
  /** Post results for the week; returns what this nickname now has posted. */
  post(nick: string, posts: Post[]): Promise<Post[]>;
  /** What this nickname has posted this week (as last heard). */
  mine(nick: string): Post[];
  /** Stop and clear this nickname's retained message for the week. */
  clear(nick: string): Promise<void>;
  subscribe(fn: () => void): () => void;
  close(): void;
}

export async function openGroup(group: string, week: number, mq: Mqtt = relay()): Promise<GroupBoard> {
  const key = keyOf(group);
  const prefix = `${await topicRoot(key)}/lb/${week}`;
  const heard = new Map<string, Member>();
  const fns = new Set<() => void>();
  const emit = () => { for (const f of fns) f(); };
  const off = subscribeLevel(mq, prefix, async (topic, payload) => {
    if (!payload.length) { heard.delete(topic); emit(); return; }
    const m = await unseal<{ n: string; e: Post[] }>(key, payload);
    if (!m || typeof m.n !== 'string') { return; }
    heard.set(topic, { n: m.n.slice(0, 20), e: cleanPosts(m.e, week) });
    emit();
  });
  mq.ready().catch(() => undefined);
  const topicFor = async (nick: string) => `${prefix}/${await nickHash(nick)}`;
  return {
    members: () => [...heard.values()],
    state: () => mq.state,
    mine: (nick) => [...heard.values()].find((m) => m.n.toLowerCase() === nick.toLowerCase())?.e ?? [],
    async post(nick, posts) {
      const t = await topicFor(nick);
      const have = heard.get(t)?.e ?? [];
      const e = addPosts(have, posts, week);
      heard.set(t, { n: nick, e }); emit();
      const p = await seal(key, { n: nick, e });
      mq.publish(t, p, true);
      setTimeout(() => mq.publish(t, p, true), 1500);
      return e;
    },
    async clear(nick) {
      const t = await topicFor(nick);
      heard.delete(t); emit();
      mq.publish(t, new Uint8Array(0), true);
      setTimeout(() => mq.publish(t, new Uint8Array(0), true), 1500);
    },
    subscribe(fn) { fns.add(fn); return () => { fns.delete(fn); }; },
    close() { off(); },
  };
}
