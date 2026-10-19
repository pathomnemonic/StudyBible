import { describe, expect, it } from 'vitest';
import { embedFor } from '../src/lib/embed';

describe('embedFor', () => {
  it('maps YouTube URLs to the privacy-enhanced embed', () => {
    expect(embedFor('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0');
    expect(embedFor('https://youtu.be/dQw4w9WgXcQ?t=1m30s')?.src).toContain('start=90');
    expect(embedFor('https://www.youtube.com/playlist?list=PLabc123')?.src).toContain('videoseries?list=PLabc123');
  });
  it('maps Spotify, Apple Podcasts, Vimeo and direct audio', () => {
    expect(embedFor('https://open.spotify.com/episode/abc123XYZ')?.src).toBe('https://open.spotify.com/embed/episode/abc123XYZ');
    expect(embedFor('https://podcasts.apple.com/us/podcast/x/id123?i=456')?.src).toMatch(/^https:\/\/embed\.podcasts\.apple\.com\/us\/podcast/);
    expect(embedFor('https://vimeo.com/12345')?.src).toBe('https://player.vimeo.com/video/12345');
    expect(embedFor('https://example.org/a/b.mp3')?.kind).toBe('audio');
  });
  it('refuses everything else, including non-https and search pages', () => {
    expect(embedFor('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(embedFor('https://www.youtube.com/results?search_query=x')).toBeNull();
    expect(embedFor('https://www.catholic.com/qa/x')).toBeNull();
    expect(embedFor('not a url')).toBeNull();
  });
});
