import { describe, it, expect } from 'vitest';
import { mergeUploads, parseFeed, type LibVideo } from '../scripts/videos/refresh';

const lib: LibVideo[] = [['aaa', 'Old one', 4], ['bbb', 'Old two', 4], ['ccc', 'Someone else', 7]];
const feed = (items: [string, string][]) => `<feed>${items.map(([id, t]) => `<entry><yt:videoId>${id}</yt:videoId><title>${t}</title><media:group><media:title>${t}</media:title></media:group></entry>`).join('')}</feed>`;

describe('daily video refresh', () => {
  it('adds only new uploads, in the right channel', () => {
    const r = mergeUploads(lib, 4, [{ id: 'new1', title: 'Fresh talk' }, { id: 'aaa', title: 'Old one' }]);
    expect(r.added).toEqual([['new1', 'Fresh talk', 4]]);
  });
  it('leaves out shorts, live streams and daily Mass', () => {
    const r = mergeUploads(lib, 4, [{ id: 'n1', title: 'A clip #shorts' }, { id: 'n2', title: 'Daily Mass for today' }, { id: 'n3', title: 'Real teaching' }, { id: 'aaa', title: 'x' }]);
    expect(r.added.map((v) => v[0])).toEqual(['n3']);
  });
  it('skips a channel id that does not match the channel', () => {
    const ups = Array.from({ length: 12 }, (_, i) => ({ id: 'z' + i, title: 'Other channel ' + i }));
    const r = mergeUploads(lib, 4, ups);
    expect(r.added).toEqual([]);
    expect(r.skipped).toMatch(/wrong channel/);
  });
  it('reads a channel feed', () => {
    const p = parseFeed(feed([['v1', 'Faith &amp; reason'], ['v2', 'Second']]));
    expect(p).toEqual([{ id: 'v1', title: 'Faith & reason' }, { id: 'v2', title: 'Second' }]);
  });
});
