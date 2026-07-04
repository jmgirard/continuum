import { describe, expect, it, vi } from 'vitest';
import { SampleBuffer } from './SampleBuffer';
import { SamplingEngine } from './samplingEngine';

/** A fake audio-like element (no requestVideoFrameCallback). */
function fakeAudio(initialTime = 0) {
  return { currentTime: initialTime } as unknown as HTMLMediaElement & { currentTime: number };
}

let capturedInterval = 0;

describe('SamplingEngine — fallback timer mode', () => {
  it('selects fixed_100hz when requestVideoFrameCallback is unavailable', () => {
    const engine = new SamplingEngine({
      media: fakeAudio(),
      getValue: () => 0,
      buffer: new SampleBuffer(),
      timerFactory: () => ({ stop: () => {} }),
    });
    expect(engine.mode).toBe('fixed_100hz');
  });

  it('captures currentTime, value, and wall clock on each tick', () => {
    const media = fakeAudio(0);
    const buffer = new SampleBuffer();
    let value = 3;
    let clock = 1000;
    const ctl: { tick: (() => void) | null } = { tick: null };

    const engine = new SamplingEngine({
      media,
      getValue: () => value,
      buffer,
      now: () => clock,
      timerFactory: (_i, cb) => {
        ctl.tick = cb;
        return { stop: () => {} };
      },
    });

    engine.start();
    media.currentTime = 0.01;
    clock = 1010;
    ctl.tick?.();
    value = 7;
    media.currentTime = 0.02;
    clock = 1020;
    ctl.tick?.();

    expect(buffer.snapshot()).toEqual([
      { sampleIndex: 0, mediaTimeS: 0.01, value: 3, wallClockMs: 1010 },
      { sampleIndex: 1, mediaTimeS: 0.02, value: 7, wallClockMs: 1020 },
    ]);
  });

  it('uses the configured fallback rate as the timer interval', () => {
    new SamplingEngine({
      media: fakeAudio(),
      getValue: () => 0,
      buffer: new SampleBuffer(),
      fallbackHz: 50,
      timerFactory: (intervalMs) => {
        capturedInterval = intervalMs;
        return { stop: () => {} };
      },
    }).start();
    expect(capturedInterval).toBe(20); // 1000 / 50
  });

  it('stops sampling on stop() and is idempotent to double start/stop', () => {
    const media = fakeAudio(0);
    const buffer = new SampleBuffer();
    const stop = vi.fn();
    const ctl: { tick: (() => void) | null } = { tick: null };
    const engine = new SamplingEngine({
      media,
      getValue: () => 1,
      buffer,
      timerFactory: (_i, cb) => {
        ctl.tick = cb;
        return { stop };
      },
    });

    engine.start();
    engine.start(); // no-op while running
    ctl.tick?.();
    expect(buffer.length).toBe(1);

    engine.stop();
    expect(stop).toHaveBeenCalledTimes(1);
    // A late tick after stop must not record.
    ctl.tick?.();
    expect(buffer.length).toBe(1);
    engine.stop(); // idempotent
  });
});

describe('SamplingEngine — per-frame (rVFC) mode', () => {
  it('records the callback mediaTime once per presented frame', () => {
    const ctl: { frameCb: ((now: number, meta: { mediaTime: number }) => void) | null } = {
      frameCb: null,
    };
    const cancel = vi.fn();
    const media = {
      currentTime: 0,
      requestVideoFrameCallback: (cb: (now: number, meta: { mediaTime: number }) => void) => {
        ctl.frameCb = cb;
        return 1;
      },
      cancelVideoFrameCallback: cancel,
    } as unknown as HTMLMediaElement;

    const buffer = new SampleBuffer();
    const engine = new SamplingEngine({ media, getValue: () => 5, buffer });
    expect(engine.mode).toBe('per_frame');

    engine.start();
    ctl.frameCb?.(0, { mediaTime: 0.0 });
    ctl.frameCb?.(0, { mediaTime: 0.0334 });

    expect(buffer.snapshot().map((s) => s.mediaTimeS)).toEqual([0.0, 0.0334]);
    expect(buffer.snapshot().every((s) => s.value === 5)).toBe(true);

    engine.stop();
    expect(cancel).toHaveBeenCalled();
  });
});
