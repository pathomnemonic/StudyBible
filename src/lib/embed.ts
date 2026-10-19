/**
 * Turn a media page URL into something that can be played inside the app, using only the platform's own sanctioned
 * embed (YouTube privacy-enhanced, Spotify, Apple Podcasts, Vimeo) or a direct audio/video file. Anything else returns
 * null and is opened at the publisher. Nothing is downloaded or re-hosted.
 */
export interface Embed {
  kind: 'iframe' | 'audio' | 'video';
  src: string;
  provider: string;
  /** height in px for iframes that are not 16:9 */
  height?: number;
}

export function embedFor(raw: string | undefined): Embed | null {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const h = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
  if (u.protocol !== 'https:') return null;
  // YouTube
  if (h === 'youtu.be') {
    const id = u.pathname.slice(1, 12);
    return /^[\w-]{11}$/.test(id) ? yt(id, u) : null;
  }
  if (h === 'youtube.com' || h === 'music.youtube.com') {
    if (u.pathname === '/watch') {
      const id = u.searchParams.get('v') ?? '';
      if (/^[\w-]{11}$/.test(id)) return yt(id, u);
      return null;
    }
    const m = /^\/(?:embed|shorts|live)\/([\w-]{11})/.exec(u.pathname);
    if (m) return yt(m[1], u);
    if (u.pathname === '/playlist') {
      const list = u.searchParams.get('list');
      if (list && /^[\w-]+$/.test(list)) return { kind: 'iframe', provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/videoseries?list=${list}` };
    }
    return null;
  }
  // Spotify (episode, show, track, playlist)
  if (h === 'open.spotify.com') {
    const m = /^\/(?:intl-[a-z]+\/)?(episode|show|track|playlist|album)\/([A-Za-z0-9]+)/.exec(u.pathname);
    if (m) return { kind: 'iframe', provider: 'Spotify', src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, height: m[1] === 'episode' || m[1] === 'show' ? 232 : 352 };
    return null;
  }
  // Apple Podcasts
  if (h === 'podcasts.apple.com') return { kind: 'iframe', provider: 'Apple Podcasts', src: `https://embed.podcasts.apple.com${u.pathname}${u.search}`, height: 175 };
  // Vimeo
  if (h === 'vimeo.com') {
    const m = /^\/(\d+)/.exec(u.pathname);
    if (m) return { kind: 'iframe', provider: 'Vimeo', src: `https://player.vimeo.com/video/${m[1]}` };
  }
  // direct files
  if (/\.(mp3|m4a|aac|ogg|oga|wav)$/i.test(u.pathname)) return { kind: 'audio', provider: u.hostname, src: u.href };
  if (/\.(mp4|webm|m4v)$/i.test(u.pathname)) return { kind: 'video', provider: u.hostname, src: u.href };
  return null;
}

function yt(id: string, u: URL): Embed {
  const t = u.searchParams.get('t') ?? u.searchParams.get('start');
  const secs = t ? parseTime(t) : 0;
  return { kind: 'iframe', provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${id}?rel=0${secs ? `&start=${secs}` : ''}` };
}
function parseTime(t: string): number {
  if (/^\d+$/.test(t)) return +t;
  const m = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/.exec(t);
  return m ? (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + +(m[3] ?? 0) : 0;
}
