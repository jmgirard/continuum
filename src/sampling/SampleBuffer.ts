import type { Sample } from './types';

/**
 * The high-frequency sample store. Lives in a mutable ref/plain object — NOT
 * React state — so appending a sample per frame (or at ~100 Hz) never triggers a
 * render. UI reads size on a throttled display path; export/autosave read a
 * snapshot.
 *
 * `sampleIndex` is assigned here as the current length, guaranteeing a monotonic,
 * contiguous index regardless of who calls `push`.
 */
export class SampleBuffer {
  private samples: Sample[] = [];

  get length(): number {
    return this.samples.length;
  }

  /** Append a sample, stamping it with the next monotonic index. Returns it. */
  push(partial: Omit<Sample, 'sampleIndex'>): Sample {
    const sample: Sample = { sampleIndex: this.samples.length, ...partial };
    this.samples.push(sample);
    return sample;
  }

  last(): Sample | undefined {
    return this.samples[this.samples.length - 1];
  }

  /** A defensive copy for export/autosave (callers must not mutate internals). */
  snapshot(): Sample[] {
    return this.samples.slice();
  }

  clear(): void {
    this.samples = [];
  }

  /** Replace the contents (used to restore an autosaved session on resume). */
  load(samples: readonly Sample[]): void {
    this.samples = samples.slice();
  }
}
