import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearSession, loadSession, saveSession } from './sessionStore';
import { SampleBuffer } from '../sampling/SampleBuffer';
import type { SessionRecord } from './types';
import type { ScaleConfig } from '../config/scale';

const scale: ScaleConfig = {
  min: 0,
  max: 8,
  steps: 9,
  lowerLabel: 'Very negative',
  upperLabel: 'Very positive',
  axisLabel: 'Valence',
  paletteId: 'blueGreyOrange',
  orientation: 'vertical',
};

function makeRecord(): SessionRecord {
  const buffer = new SampleBuffer();
  buffer.push({ mediaTimeS: 0, value: 4, wallClockMs: 1000 });
  buffer.push({ mediaTimeS: 0.033, value: 5, wallClockMs: 1033 });
  buffer.push({ mediaTimeS: 0.067, value: 6, wallClockMs: 1067 });
  return {
    appVersion: '0.1.0',
    mediaReference: 'clip_02_interview.webm',
    mediaKind: 'video',
    scale,
    samplingMode: 'per_frame',
    samples: buffer.snapshot(),
    lastValue: 6,
    createdAt: '2026-07-05T10:00:00.000Z',
    updatedAt: '2026-07-05T10:02:00.000Z',
  };
}

describe('sessionStore', () => {
  beforeEach(async () => {
    await clearSession();
  });

  it('returns undefined when nothing is saved', async () => {
    expect(await loadSession()).toBeUndefined();
  });

  it('saves and loads a session record faithfully (save → reload → resume)', async () => {
    const record = makeRecord();
    await saveSession(record);

    const loaded = await loadSession();
    expect(loaded).toEqual(record);

    // Resume: reload the samples into a fresh buffer and confirm identical data,
    // and that appending continues the monotonic index.
    const resumed = new SampleBuffer();
    resumed.load(loaded!.samples);
    expect(resumed.snapshot()).toEqual(record.samples);
    expect(resumed.push({ mediaTimeS: 0.1, value: 7, wallClockMs: 1100 }).sampleIndex).toBe(3);
  });

  it('overwrites the previous session on save', async () => {
    await saveSession(makeRecord());
    await saveSession({ ...makeRecord(), lastValue: 2, mediaReference: 'other.mp4' });
    const loaded = await loadSession();
    expect(loaded?.mediaReference).toBe('other.mp4');
    expect(loaded?.lastValue).toBe(2);
  });

  it('clears a saved session', async () => {
    await saveSession(makeRecord());
    await clearSession();
    expect(await loadSession()).toBeUndefined();
  });
});
