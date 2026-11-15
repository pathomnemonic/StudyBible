import { describe, expect, it } from 'vitest';
import { latestRequest } from '../src/lib/latestRequest';

/** A tiny model of the Memorize effect: ask for a card's text, apply the reply only if it is still the latest request. */
function session() {
  const req = latestRequest();
  const shown: { text: string | null } = { text: null };
  const resolvers = new Map<string, (t: string) => void>();
  const show = (card: string) => {
    shown.text = null; // the page clears the old text when the card changes
    const ticket = req.next();
    new Promise<string>((res) => resolvers.set(card, res)).then((t) => { if (ticket.isCurrent()) shown.text = t; });
  };
  return { shown, show, reply: async (card: string, t: string) => { resolvers.get(card)!(t); await Promise.resolve(); await Promise.resolve(); }, cancel: () => req.cancel() };
}

describe('Memorize: a late reply for an earlier card never replaces the current card', () => {
  it('the earlier card answers last: its text is dropped', async () => {
    const s = session();
    s.show('A'); s.show('B');
    await s.reply('B', 'text of B');
    await s.reply('A', 'text of A (late)');
    expect(s.shown.text).toBe('text of B');
  });
  it('the earlier card answers first: still replaced by the later card', async () => {
    const s = session();
    s.show('A'); s.show('B');
    await s.reply('A', 'text of A');
    expect(s.shown.text).toBeNull();
    await s.reply('B', 'text of B');
    expect(s.shown.text).toBe('text of B');
  });
  it('five quick changes show only the last card', async () => {
    const s = session();
    for (const c of ['A', 'B', 'C', 'D', 'E']) s.show(c);
    for (const c of ['E', 'D', 'C', 'B', 'A']) await s.reply(c, `text of ${c}`);
    expect(s.shown.text).toBe('text of E');
  });
  it('a reply after cleanup (the page left the card) is dropped', async () => {
    const s = session();
    s.show('A'); s.cancel();
    await s.reply('A', 'text of A');
    expect(s.shown.text).toBeNull();
  });
  it('a single request is applied', async () => {
    const s = session();
    s.show('A');
    await s.reply('A', 'text of A');
    expect(s.shown.text).toBe('text of A');
  });
});
