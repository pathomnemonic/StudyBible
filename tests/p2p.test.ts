import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain JS helper
import { startBroker } from '../scripts/dev/mini-broker.mjs';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
let broker: { port: number; close: () => void };
beforeAll(async () => { broker = await startBroker(0); store.set('sb:live:brokers', `ws://127.0.0.1:${broker.port}/mqtt`); });
afterAll(() => broker.close());

const content = { title: 'P2P', slides: [], questions: [
  { type: 'mc' as const, q: 'Pick B', options: ['A', 'B', 'C', 'D'], correct: [1], time: 20, points: 1 as const },
  { type: 'tf' as const, q: 'True?', correct: [0], time: 10, points: 1 as const },
] };
const until = async (f: () => boolean, ms = 6000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error('timed out'); await new Promise((r) => setTimeout(r, 25)); } };

describe('a class with no server: the teacher’s device runs it, students reach it through a relay', () => {
  it('lets a student join by code, play a question and be scored, all sealed', { timeout: 30000 }, async () => {
    const link = await import('../src/live/link');
    const { sanitizeSettings } = await import('../src/live/engine');
    const host = await link.createHost(content, sanitizeSettings({ shuffleOptions: false }), ['Ann Lee', 'Ben Cruz']);
    expect(host.via).toBe('p2p');
    expect(host.code).toMatch(/^\d{6}$/);
    const info = await link.peekRoom(host.code);
    expect(info).toMatchObject({ title: 'P2P', via: 'p2p', rosterOnly: true });
    expect(info.roster).toEqual(['Ann Lee', 'Ben Cruz']);
    await expect(link.joinRoom(host.code, 'Nobody')).rejects.toThrow(/class list/);
    const ann = await link.joinRoom(host.code, 'Ann Lee');
    await until(() => host.view?.players.length === 1);
    expect(ann.token).toBeTruthy();
    await host.act('quiz');
    await until(() => ann.view?.phase === 'question');
    expect(JSON.stringify(ann.view)).not.toContain('"correct"');
    await ann.answer(1);
    await until(() => host.view?.phase === 'results'); // the only player answered, so the question ends
    await until(() => ann.view?.me?.last?.correct === true);
    expect(host.view!.results!.players[0]).toMatchObject({ name: 'Ann Lee', correct: 1 });
    // a reload on the student's side picks the session up again from the token
    const again = await link.rejoin(ann.code, ann.token);
    await until(() => !!again.view);
    expect(again.view!.me!.name).toBe('Ann Lee');
    again.close(); ann.close();
    expect(await host.csv()).toContain('Ann Lee');
    host.close();
  });
  it('resumes a teacher’s session after a reload from its saved snapshot', { timeout: 30000 }, async () => {
    const link = await import('../src/live/link');
    const { sanitizeSettings } = await import('../src/live/engine');
    const host = await link.createHost(content, sanitizeSettings({}), []);
    const a = await link.joinRoom(host.code, 'Zed');
    await until(() => host.view?.players.length === 1);
    await host.act('quiz');
    const snap = store.get(`sb:live:snap:${host.code}`);
    expect(snap).toBeTruthy();
    host.close(); a.close();
    // the teacher reloads the page: the snapshot brings the room back with the same code, the player and the question
    store.set(`sb:live:snap:${host.code}`, JSON.stringify({ ...JSON.parse(snap!), players: JSON.parse(snap!).players }));
    const back = await link.resumeHost(host.code) as import('../src/live/link').HostLink;
    expect(back.code).toBe(host.code);
    expect(back.view!.players.map((p) => p.name)).toEqual(['Zed']);
    const again = await link.rejoin(host.code, a.token);
    await until(() => !!again.view);
    expect(again.view!.me!.name).toBe('Zed');
    again.close(); back.close();
  });
});
