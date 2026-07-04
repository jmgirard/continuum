import { describe, expect, it } from 'vitest';
import { SampleBuffer } from './SampleBuffer';

describe('SampleBuffer', () => {
  it('assigns monotonic, contiguous sample indices', () => {
    const buffer = new SampleBuffer();
    buffer.push({ mediaTimeS: 0, value: 1, wallClockMs: 100 });
    buffer.push({ mediaTimeS: 0.033, value: 2, wallClockMs: 133 });
    buffer.push({ mediaTimeS: 0.067, value: 3, wallClockMs: 167 });

    expect(buffer.length).toBe(3);
    expect(buffer.snapshot().map((s) => s.sampleIndex)).toEqual([0, 1, 2]);
  });

  it('records the media time, value, and wall clock verbatim', () => {
    const buffer = new SampleBuffer();
    const sample = buffer.push({ mediaTimeS: 1.5, value: 42, wallClockMs: 999 });
    expect(sample).toEqual({ sampleIndex: 0, mediaTimeS: 1.5, value: 42, wallClockMs: 999 });
    expect(buffer.last()).toEqual(sample);
  });

  it('snapshot is a defensive copy', () => {
    const buffer = new SampleBuffer();
    buffer.push({ mediaTimeS: 0, value: 0, wallClockMs: 0 });
    const snap = buffer.snapshot();
    snap.push({ sampleIndex: 99, mediaTimeS: 9, value: 9, wallClockMs: 9 });
    expect(buffer.length).toBe(1);
  });

  it('clear() empties and restarts indexing', () => {
    const buffer = new SampleBuffer();
    buffer.push({ mediaTimeS: 0, value: 0, wallClockMs: 0 });
    buffer.clear();
    expect(buffer.length).toBe(0);
    expect(buffer.push({ mediaTimeS: 1, value: 1, wallClockMs: 1 }).sampleIndex).toBe(0);
  });

  it('load() restores samples for resume', () => {
    const buffer = new SampleBuffer();
    buffer.load([
      { sampleIndex: 0, mediaTimeS: 0, value: 5, wallClockMs: 10 },
      { sampleIndex: 1, mediaTimeS: 0.03, value: 6, wallClockMs: 20 },
    ]);
    expect(buffer.length).toBe(2);
    // Appending continues the monotonic index.
    expect(buffer.push({ mediaTimeS: 0.06, value: 7, wallClockMs: 30 }).sampleIndex).toBe(2);
  });
});
