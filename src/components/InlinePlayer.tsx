import type { Embed } from '../lib/embed';

/** Plays a video/podcast without leaving the app. iframes are sandboxed and use the platform's own embed. */
export default function InlinePlayer({ embed, title }: { embed: Embed; title: string }) {
  if (embed.kind === 'audio') return <audio className="inline-player" controls preload="none" src={embed.src} aria-label={title} />;
  if (embed.kind === 'video') return <video className="inline-player" controls preload="none" src={embed.src} aria-label={title} />;
  return (
    <div className="inline-player frame" style={embed.height ? { aspectRatio: 'auto', height: embed.height } : undefined}>
      <iframe
        src={embed.src}
        title={`${title} (${embed.provider})`}
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
