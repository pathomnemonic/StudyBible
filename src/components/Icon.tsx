const P: Record<string, string> = {
  read: 'M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5v-12zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5v-12z',
  study: 'M12 3 2 8l10 5 8-4v6h2V8L12 3zM6 12.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.5l-6 3-6-3z',
  learn: 'M10 2h4v6h6v4h-6v10h-4V12H4V8h6z',
  listen: 'M12 3a9 9 0 0 0-9 9v6a3 3 0 0 0 3 3h2v-8H5v-1a7 7 0 0 1 14 0v1h-3v8h2a3 3 0 0 0 3-3v-6a9 9 0 0 0-9-9z',
  pray: 'M12 2c.6 3.5 3 5 3 8a3 3 0 0 1-6 0c0-1.2.5-2 1-2.8C9 8.5 6 11 6 14.5a6 6 0 0 0 12 0C18 8 13 6.5 12 2z',
  library: 'M5 3h4v18H5zM10 3h4v18h-4zM15.2 4.1l3.9-1 4 15.2-3.9 1z',
  search: 'M10.5 3a7.5 7.5 0 1 0 4.6 13.4l4.5 4.5 1.4-1.4-4.5-4.5A7.5 7.5 0 0 0 10.5 3zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11z',
  gear: 'M19.4 13a7.7 7.7 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.4 3a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.4L6.6 11a7.7 7.7 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a7.6 7.6 0 0 0 1.7 1l.4 3h4l.4-3a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.4L19.4 13zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
  music: 'M9 18V6l11-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  memorize: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  pen: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  chevL: 'M15 5l-7 7 7 7',
  chevR: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6 6 18',
  text: 'M3 19 9 5l6 14M5.5 14h7M14 19l3.5-8L21 19M15.5 16.5h4',
  columns: 'M4 5h7v14H4zM13 5h7v14h-7z',
  note: 'M5 3h10l4 4v14H5zM8 11h8M8 15h6',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  highlight: 'M4 20h16M7 16l8-8 3 3-8 8H7zM14 7l1.5-1.5 3 3L17 10',
  copy: 'M8 8h11v13H8zM5 16V3h11',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1',
  play: 'M7 4v16l13-8z',
  pause: 'M7 4h4v16H7zM13 4h4v16h-4z',
  check: 'M5 13l4 4L19 7',
  plus: 'M12 5v14M5 12h14',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  compare: 'M4 6h16M4 12h10M4 18h16',
  sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  queue: 'M3 6h14M3 12h14M3 18h8M18 14v6l5-3z',
  download: 'M12 3v12M7 11l5 5 5-5M4 21h16',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 10v7M12 7v1',
  filter: 'M3 5h18l-7 8v6l-4-2v-4z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7',
};

export default function Icon({ name, size = 22, fill = false }: { name: keyof typeof P | string; size?: number; fill?: boolean }) {
  const d = P[name] ?? '';
  const filled = fill || ['read', 'study', 'listen', 'pray', 'library', 'gear', 'play', 'pause'].includes(name);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
