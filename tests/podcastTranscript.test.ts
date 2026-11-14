import { describe, expect, it } from 'vitest';
import { parseTranscript, pickTranscript } from '../src/data/feeds';

describe('Podcasting 2.0 transcripts', () => {
  it('reads WebVTT with hours, minutes and tags', () => {
    const vtt = 'WEBVTT\n\n00:00:01.500 --> 00:00:04.000\n<v Fr. Mike>Welcome to the show.\n\n1:02:03.250 --> 1:02:05.000\nSecond  line\nwraps here\n';
    expect(parseTranscript(vtt, 'text/vtt')).toEqual([{ t: 1.5, text: 'Welcome to the show.' }, { t: 3723.25, text: 'Second line wraps here' }]);
  });
  it('reads SRT with numbered blocks and comma decimals', () => {
    const srt = '1\n00:00:02,000 --> 00:00:03,000\nHello\n\n2\n00:01:00,500 --> 00:01:02,000\nWorld\n';
    expect(parseTranscript(srt, 'application/x-subrip')).toEqual([{ t: 2, text: 'Hello' }, { t: 60.5, text: 'World' }]);
  });
  it('reads the JSON form and drops empty segments', () => {
    const j = JSON.stringify({ version: '1.0.0', segments: [{ startTime: 0, speaker: 'A', body: 'First' }, { startTime: 5, body: '' }, { startTime: 9.5, body: 'Third' }] });
    expect(parseTranscript(j, 'application/json')).toEqual([{ t: 0, text: 'First' }, { t: 9.5, text: 'Third' }]);
    expect(parseTranscript('not json', 'application/json')).toEqual([]);
  });
  it('plain text is untimed (so it can never be mistaken for a synchronised one)', () => {
    expect(parseTranscript('One.\n\nTwo.', 'text/plain')).toEqual([{ t: -1, text: 'One.' }, { t: -1, text: 'Two.' }]);
  });
  it('malformed times are skipped, not guessed', () => {
    expect(parseTranscript('WEBVTT\n\nsoon --> later\nHi\n\n00:00:03.000 --> 00:00:04.000\nOk\n', 'text/vtt')).toEqual([{ t: 3, text: 'Ok' }]);
  });
  it('prefers a timed format and never picks an HTML page or an unsafe address', () => {
    expect(pickTranscript([{ url: 'https://x/t.html', type: 'text/html' }, { url: 'https://x/t.txt', type: 'text/plain' }, { url: 'https://x/t.vtt', type: 'text/vtt; charset=utf-8' }])?.url).toBe('https://x/t.vtt');
    expect(pickTranscript([{ url: 'https://x/t.html', type: 'text/html' }])).toBeUndefined();
    expect(pickTranscript([{ url: 'javascript:alert(1)', type: 'text/vtt' }])).toBeUndefined();
  });
  // parseFeed itself needs a browser DOM (DOMParser); the transcript tag is read there and exercised by e2e/transcript.mjs
});
