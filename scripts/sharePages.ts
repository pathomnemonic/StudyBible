import type { ShareGame } from '../src/lib/shareGames';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** the Open Graph and Twitter tags for a page; image and url must be absolute for a message app to use them */
export const previewTags = (o: { siteName: string; title: string; description: string; url: string; image: string }) => [
  `<meta property="og:type" content="website" />`,
  `<meta property="og:site_name" content="${esc(o.siteName)}" />`,
  `<meta property="og:title" content="${esc(o.title)}" />`,
  `<meta property="og:description" content="${esc(o.description)}" />`,
  `<meta property="og:url" content="${esc(o.url)}" />`,
  `<meta property="og:image" content="${esc(o.image)}" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${esc(o.title)}" />`,
  `<meta name="twitter:description" content="${esc(o.description)}" />`,
  `<meta name="twitter:image" content="${esc(o.image)}" />`,
].join('\n    ');

/** a small static page for one game: it carries the preview tags, then opens the game in the app */
export const sharePageHtml = (o: { siteUrl: string; siteName: string; game: ShareGame }) => {
  const abs = (p: string) => (o.siteUrl ? o.siteUrl + p : '../' + p);
  const url = abs(`share/${o.game.slug}.html`), app = abs(`#${o.game.path}`);
  const title = `${o.game.name} · ${o.siteName}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(o.game.blurb)}" />
    ${previewTags({ siteName: o.siteName, title, description: o.game.blurb, url, image: abs(o.game.image) })}
    <meta http-equiv="refresh" content="0;url=${esc(app)}" />
    <script>location.replace(${JSON.stringify(app)});</script>
  </head>
  <body style="font-family:system-ui;background:#0a0c1c;color:#f1edff;text-align:center;padding:3rem 1rem">
    <p>Opening ${esc(o.game.name)}…</p>
    <p><a style="color:#ffd966" href="${esc(app)}">Tap here if it does not open</a></p>
  </body>
</html>
`;
};
