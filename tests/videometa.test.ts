import { describe, expect, it } from 'vitest';
import { fmtLength, youtubeId } from '../src/lib/videoMeta';

describe('video lengths', () => {
  it('reads as a person would say it', () => {
    expect(fmtLength(undefined)).toBe('');
    expect(fmtLength(0)).toBe('');
    expect(fmtLength(45)).toBe('45 sec');
    expect(fmtLength(60 * 25 + 29)).toBe('25 min');
    expect(fmtLength(3600)).toBe('1 h');
    expect(fmtLength(3600 + 65 * 60 / 13 * 13 - 3600)).toBe('1 h 5 min');
    expect(fmtLength(2 * 3600 + 30 * 60)).toBe('2 h 30 min');
  });
  it('finds the video id in watch, embed and short links', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=shwMd1x-g1g')).toBe('shwMd1x-g1g');
    expect(youtubeId('https://www.youtube-nocookie.com/embed/shwMd1x-g1g?rel=0')).toBe('shwMd1x-g1g');
    expect(youtubeId('https://youtu.be/shwMd1x-g1g')).toBe('shwMd1x-g1g');
    expect(youtubeId('https://www.catholic.com/audio/x')).toBeUndefined();
  });
});
