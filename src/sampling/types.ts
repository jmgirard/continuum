/** Sampling-layer shared types. */

/**
 * One raw rating sample. This is the atom the whole app protects: every sample
 * and its timestamps are retained so downstream quality metrics remain derivable.
 */
export interface Sample {
  /** Monotonic index within the session (0, 1, 2, …). */
  readonly sampleIndex: number;
  /** Media playback time in seconds when the sample was taken. */
  readonly mediaTimeS: number;
  /** The control's true logical value (never the display-smoothed position). */
  readonly value: number;
  /** Wall-clock time (ms since epoch) the sample was captured. */
  readonly wallClockMs: number;
}

/**
 * How samples are being driven. Maps directly to the CSV `sampling_mode` header:
 * one sample per presented video frame, or a fixed-rate fallback timer.
 */
export type SamplingMode = 'per_frame' | 'fixed_100hz';
