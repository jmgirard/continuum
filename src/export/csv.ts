import { APP_VERSION, STUDY_ID } from '../config/appInfo';
import type { ScaleConfig } from '../config/scale';
import type { Sample, SamplingMode } from '../sampling/types';

/**
 * Self-describing CSV export — the STABLE data contract the downstream R package
 * reads. A commented `# key: value` metadata header (the config snapshot), then a
 * header row, then one row per raw sample. `readr::read_csv(comment = "#")` parses
 * it cleanly. 1D column names are exactly `sample_index, media_time_s, value`.
 *
 * See CLAUDE.md (CSV export contract). Keep metadata keys stable.
 */
export interface ExportParams {
  scale: ScaleConfig;
  mediaReference: string;
  samplingMode: SamplingMode;
  createdAt: string;
  samples: readonly Sample[];
  /** Defaults to now; injectable for deterministic tests. */
  exportedAt?: string;
}

/**
 * Format a number for CSV: clamp float noise to microsecond precision and drop
 * trailing zeros, without altering the recorded logical value meaningfully.
 */
function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return String(Number(n.toFixed(6)));
}

/** Ordered metadata key/value pairs for the commented header. */
export function buildMetadata(p: ExportParams): [string, string][] {
  const steps = p.scale.steps === 'continuous' ? 'continuous' : String(p.scale.steps);
  const pairs: ([string, string] | null)[] = [
    ['app_version', APP_VERSION],
    ['study_id', STUDY_ID],
    ['dimensionality', '1D'],
    ['media_reference', p.mediaReference],
    ['sampling_mode', p.samplingMode],
    ['scale_lower_label', p.scale.lowerLabel],
    ['scale_upper_label', p.scale.upperLabel],
    p.scale.axisLabel ? ['scale_axis_label', p.scale.axisLabel] : null,
    ['scale_min', String(p.scale.min)],
    ['scale_max', String(p.scale.max)],
    ['scale_steps', steps],
    ['created_at', p.createdAt],
    ['exported_at', p.exportedAt ?? new Date().toISOString()],
  ];
  return pairs.filter((pair): pair is [string, string] => pair !== null);
}

/** Build the full self-describing CSV text. */
export function buildCsv(p: ExportParams): string {
  const lines = buildMetadata(p).map(([key, value]) => `# ${key}: ${value}`);
  lines.push('sample_index,media_time_s,value');
  for (const s of p.samples) {
    lines.push(`${s.sampleIndex},${formatNumber(s.mediaTimeS)},${formatNumber(s.value)}`);
  }
  return lines.join('\n') + '\n';
}

/** Derive a friendly download filename from the media reference. */
export function exportFilename(mediaReference: string): string {
  const base = mediaReference.replace(/\.[^./\\]+$/, '') || 'session';
  const safe = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'session';
  return `${safe}_1D_ratings.csv`;
}

/** Trigger a browser download of the CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
