import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { previewTags, sharePageHtml } from '../scripts/sharePages';
import { SHARE_GAMES } from '../src/lib/shareGames';

const menu = readFileSync('src/pages/play/PlayHome.tsx', 'utf8');

describe('link previews', () => {
  it('give every shared game a page with its own title, blurb and an absolute picture, that opens the game', () => {
    for (const game of SHARE_GAMES) {
      const html = sharePageHtml({ siteUrl: 'https://example.github.io/App/', siteName: 'Cathology', game });
      expect(html, game.slug).toContain(`<meta property="og:title" content="${game.name} · Cathology" />`);
      expect(html).toContain(`<meta property="og:description" content="${game.blurb.replace(/&/g, '&amp;')}" />`);
      expect(html).toContain(`<meta property="og:image" content="https://example.github.io/App/${game.image}" />`);
      expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
      expect(html).toContain(`url=https://example.github.io/App/#${game.path}`);
      expect(html).toContain(`location.replace("https://example.github.io/App/#${game.path}")`);
    }
  });
  it('use names and blurbs that match the games menu, and games that exist', () => {
    for (const g of SHARE_GAMES) { expect(menu, g.slug).toContain(`'${g.path}', '${g.name}', '${g.blurb}'`); }
    expect(new Set(SHARE_GAMES.map((g) => g.slug)).size).toBe(SHARE_GAMES.length);
  });
  it('escape quotes and angle brackets in the tags', () => {
    expect(previewTags({ siteName: 'A"B', title: '<x>', description: 'd', url: 'u', image: 'i' })).toContain('content="A&quot;B"');
    expect(previewTags({ siteName: 'a', title: '<x>', description: 'd', url: 'u', image: 'i' })).toContain('&lt;x>');
  });
});
