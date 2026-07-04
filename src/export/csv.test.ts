import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import { buildCsv, buildMetadata, exportFilename, type ExportParams } from './csv';
import { SampleBuffer } from '../sampling/SampleBuffer';
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

function makeParams(overrides: Partial<ExportParams> = {}): ExportParams {
  const buffer = new SampleBuffer();
  buffer.push({ mediaTimeS: 0, value: 4, wallClockMs: 1000 });
  buffer.push({ mediaTimeS: 0.0334, value: 5, wallClockMs: 1033 });
  buffer.push({ mediaTimeS: 0.0667, value: 6, wallClockMs: 1067 });
  return {
    scale,
    mediaReference: 'clip_02_interview.webm',
    samplingMode: 'per_frame',
    createdAt: '2026-07-05T10:00:00.000Z',
    exportedAt: '2026-07-05T10:05:00.000Z',
    samples: buffer.snapshot(),
    ...overrides,
  };
}

/** Read `# key: value` comment lines back into a map (mirrors what the header carries). */
function parseMetadata(csv: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const line of csv.split('\n')) {
    const match = /^# ([^:]+): (.*)$/.exec(line);
    if (match) map[match[1]!] = match[2]!;
  }
  return map;
}

describe('CSV export', () => {
  it('emits the stable 1D column header', () => {
    const csv = buildCsv(makeParams());
    const headerRow = csv.split('\n').find((l) => !l.startsWith('#') && l.length > 0);
    expect(headerRow).toBe('sample_index,media_time_s,value');
  });

  it('carries the config snapshot in the commented metadata header', () => {
    const meta = parseMetadata(buildCsv(makeParams()));
    expect(meta).toMatchObject({
      app_version: '0.1.0',
      study_id: 'local',
      dimensionality: '1D',
      media_reference: 'clip_02_interview.webm',
      sampling_mode: 'per_frame',
      scale_lower_label: 'Very negative',
      scale_upper_label: 'Very positive',
      scale_axis_label: 'Valence',
      scale_min: '0',
      scale_max: '8',
      scale_steps: '9',
      created_at: '2026-07-05T10:00:00.000Z',
      exported_at: '2026-07-05T10:05:00.000Z',
    });
  });

  it('parses cleanly with readr-style comment handling (papaparse round-trip)', () => {
    const params = makeParams();
    const csv = buildCsv(params);

    // papaparse's overloads collapse to the Node-stream signature here; use a
    // narrow typed view of parse for the string-input case.
    interface Row {
      sample_index: number;
      media_time_s: number;
      value: number;
    }
    const parse = Papa.parse as unknown as (
      input: string,
      config: Papa.ParseConfig,
    ) => { data: Row[]; errors: unknown[] };

    const parsed = parse(csv, {
      comments: '#',
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    expect(parsed.errors).toEqual([]);
    expect(parsed.data).toEqual([
      { sample_index: 0, media_time_s: 0, value: 4 },
      { sample_index: 1, media_time_s: 0.0334, value: 5 },
      { sample_index: 2, media_time_s: 0.0667, value: 6 },
    ]);
  });

  it('reflects continuous scales and the audio sampling mode', () => {
    const continuousScale: ScaleConfig = {
      min: -100,
      max: 100,
      steps: 'continuous',
      lowerLabel: 'neg',
      upperLabel: 'pos',
      paletteId: 'viridis',
      orientation: 'vertical',
    };
    const meta = parseMetadata(
      buildCsv(makeParams({ scale: continuousScale, samplingMode: 'fixed_100hz' })),
    );
    expect(meta.scale_steps).toBe('continuous');
    expect(meta.sampling_mode).toBe('fixed_100hz');
    expect(meta.scale_axis_label).toBeUndefined();
  });

  it('includes exactly one row per sample and preserves order', () => {
    const meta = buildMetadata(makeParams());
    expect(meta.find(([k]) => k === 'dimensionality')?.[1]).toBe('1D');

    const csv = buildCsv(makeParams());
    const dataRows = csv
      .split('\n')
      .filter((l) => l.length > 0 && !l.startsWith('#') && l !== 'sample_index,media_time_s,value');
    expect(dataRows).toEqual(['0,0,4', '1,0.0334,5', '2,0.0667,6']);
  });

  it('derives a safe download filename', () => {
    expect(exportFilename('clip_02_interview.webm')).toBe('clip_02_interview_1D_ratings.csv');
    expect(exportFilename('my take (final).mp4')).toBe('my_take_final_1D_ratings.csv');
    expect(exportFilename('noext')).toBe('noext_1D_ratings.csv');
  });
});
