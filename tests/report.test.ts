import { describe, expect, it } from 'vitest';
import { diagnostics, reportUrl, screenOf } from '../src/lib/report';

describe('problem report', () => {
  it('names the screen but drops a query, which can hold what the reader typed', () => {
    expect(screenOf('#/study/ask-all?q=why%20do%20I%20doubt')).toBe('/study/ask-all');
    expect(screenOf('')).toBe('/');
  });
  it('includes build, screen and connection, and nothing else', () => {
    const d = diagnostics({ hash: '#/library?tab=export', online: false, width: 390, build: 'abc1234 2026-11-14' });
    expect(d).toBe('Build: abc1234 2026-11-14\nScreen: /library\nOnline: no\nWindow width: 390px');
  });
  it('builds an issue link carrying the item and source, with no private text', () => {
    const u = reportUrl({ title: 'Problem with: X', item: 'ccc-1374', source: 'Catechism', hash: '#/study/ask-all?q=secret' });
    const body = decodeURIComponent(u.split('body=')[1]);
    expect(u).toContain('issues/new?title=Problem%20with%3A%20X');
    expect(body).toContain('Item: ccc-1374');
    expect(body).toContain('Source: Catechism');
    expect(body).toContain('Screen: /study/ask-all');
    expect(body).not.toContain('secret');
  });
});
