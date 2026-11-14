/** How a copied passage is written. The text is the translation's own; only the wrapping changes. */
export type CopyStyle = 'numbers' | 'plain' | 'quote' | 'markdown' | 'reference';

export const COPY_STYLES: [CopyStyle, string][] = [
  ['numbers', 'Text with verse numbers, then the citation'],
  ['plain', 'Plain text, then the citation'],
  ['quote', 'A quotation with the citation after it'],
  ['markdown', 'Markdown block quote with the citation in bold'],
  ['reference', 'The reference only, without the text'],
];

export function formatCopy(style: CopyStyle, verses: { n: number; text: string }[], label: string, translation: string): string {
  const cite = `${label} (${translation})`;
  const body = (numbered: boolean) => verses.map((v) => (numbered ? `${v.n} ${v.text}` : v.text)).join(' ');
  switch (style) {
    case 'reference': return cite;
    case 'quote': return `“${body(false)}” — ${cite}`;
    case 'markdown': return `${verses.map((v) => `> ${v.text}`).join('\n>\n')}\n\n**${cite}**`;
    case 'plain': return `${body(false)}\n— ${cite}`;
    default: return `${body(true)}\n— ${cite}`;
  }
}
