import { describe, expect, it } from 'vitest';
import { detectMediaKind, formatRemaining, formatTimecode, playbackFraction } from './mediaFile';

function fakeFile(name: string, type: string): File {
  return new File(['x'], name, { type });
}

describe('detectMediaKind', () => {
  it('classifies by MIME type first', () => {
    expect(detectMediaKind(fakeFile('a.mp4', 'video/mp4'))).toBe('video');
    expect(detectMediaKind(fakeFile('a.mp3', 'audio/mpeg'))).toBe('audio');
  });

  it('falls back to the file extension when MIME is missing', () => {
    expect(detectMediaKind(fakeFile('clip.webm', ''))).toBe('video');
    expect(detectMediaKind(fakeFile('voice.wav', ''))).toBe('audio');
    expect(detectMediaKind(fakeFile('take.MOV', ''))).toBe('video');
  });

  it('returns null for clearly non-media files', () => {
    expect(detectMediaKind(fakeFile('notes.txt', 'text/plain'))).toBeNull();
    expect(detectMediaKind(fakeFile('nodots', ''))).toBeNull();
  });
});

describe('formatTimecode', () => {
  it('formats MM:SS', () => {
    expect(formatTimecode(0)).toBe('00:00');
    expect(formatTimecode(42)).toBe('00:42');
    expect(formatTimecode(78)).toBe('01:18');
    expect(formatTimecode(600)).toBe('10:00');
  });

  it('adds an hours field past an hour', () => {
    expect(formatTimecode(3661)).toBe('1:01:01');
  });

  it('clamps negative and non-finite input to zero', () => {
    expect(formatTimecode(-5)).toBe('00:00');
    expect(formatTimecode(Number.NaN)).toBe('00:00');
    expect(formatTimecode(Number.POSITIVE_INFINITY)).toBe('00:00');
  });

  it('floors fractional seconds (does not round up)', () => {
    expect(formatTimecode(42.9)).toBe('00:42');
  });
});

describe('formatRemaining', () => {
  it('shows a leading U+2212 minus and the remaining time', () => {
    expect(formatRemaining(42, 120)).toBe('−01:18');
  });

  it('never goes negative once playback passes the duration', () => {
    expect(formatRemaining(130, 120)).toBe('−00:00');
  });

  it('is zero when duration is unknown', () => {
    expect(formatRemaining(10, 0)).toBe('−00:00');
  });
});

describe('playbackFraction', () => {
  it('is the ratio of current time to duration', () => {
    expect(playbackFraction(30, 120)).toBeCloseTo(0.25);
  });

  it('clamps to [0, 1] and handles unknown duration', () => {
    expect(playbackFraction(-1, 120)).toBe(0);
    expect(playbackFraction(200, 120)).toBe(1);
    expect(playbackFraction(10, 0)).toBe(0);
  });
});
