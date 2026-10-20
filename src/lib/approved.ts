import { getBook } from './canon';

export interface ApprovedLink { id: string; name: string; note: string; url: string }

/** Church-approved modern translations. They are under copyright, so the app cannot include their text; these open the chapter at the publisher's or a licensed reader. `chapter` is in the English/Hebrew chapter numbering. */
export function approvedLinks(book: string, chapter: number): ApprovedLink[] {
  const name = getBook(book)?.name ?? book;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const bg = (v: string) => `https://www.biblegateway.com/passage/?search=${encodeURIComponent(`${name} ${chapter}`)}&version=${v}`;
  return [
    { id: 'nabre', name: 'New American Bible, Revised Edition (NABRE)', note: 'The text of the U.S. Lectionary’s base translation; read free on the USCCB’s own site.', url: `https://bible.usccb.org/bible/${slug}/${chapter}` },
    { id: 'rsvce', name: 'Revised Standard Version, Catholic Edition (RSV-CE)', note: 'Widely used by Catholic readers and study Bibles. Opens at Bible Gateway.', url: bg('RSVCE') },
    { id: 'nrsvce', name: 'New Revised Standard Version, Catholic Edition (NRSV-CE)', note: 'A modern, ecumenical translation approved for Catholic use. Opens at Bible Gateway.', url: bg('NRSVCE') },
  ];
}
