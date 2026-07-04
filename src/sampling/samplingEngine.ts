import type { SampleBuffer } from './SampleBuffer';
import type { SamplingMode } from './types';

/** A running fallback timer; `stop` tears it down. */
export interface SamplingTimer {
  stop(): void;
}

/** Creates a repeating timer that calls `onTick` every `intervalMs`. */
export type TimerFactory = (intervalMs: number, onTick: () => void) => SamplingTimer;

export interface SamplingEngineOptions {
  media: HTMLMediaElement;
  /** Reads the control's current true logical value at sample time. */
  getValue: () => number;
  buffer: SampleBuffer;
  /** Fallback timer rate in Hz (default 100). */
  fallbackHz?: number;
  /** Wall-clock source (default Date.now); injectable for tests. */
  now?: () => number;
  /** Fallback timer factory (default a Web-Worker timer); injectable for tests. */
  timerFactory?: TimerFactory;
}

export const DEFAULT_FALLBACK_HZ = 100;

/**
 * The heart of Phase 1: turns playback into a stream of samples.
 *
 * - **Video with `requestVideoFrameCallback`** → one sample per presented frame,
 *   recording the callback's exact `mediaTime`.
 * - **Audio / no rVFC** → a fixed-rate (~100 Hz) timer that reads
 *   `media.currentTime`. The default timer runs in a Web Worker to resist
 *   background-tab throttling.
 *
 * Start/stop is driven externally by play/pause. Sampling never writes React
 * state; it appends to the injected {@link SampleBuffer}.
 */
export class SamplingEngine {
  readonly mode: SamplingMode;

  private readonly media: HTMLMediaElement;
  private readonly getValue: () => number;
  private readonly buffer: SampleBuffer;
  private readonly intervalMs: number;
  private readonly now: () => number;
  private readonly timerFactory: TimerFactory;

  private running = false;
  private rvfcHandle: number | null = null;
  private timer: SamplingTimer | null = null;

  constructor(options: SamplingEngineOptions) {
    this.media = options.media;
    this.getValue = options.getValue;
    this.buffer = options.buffer;
    this.intervalMs = 1000 / (options.fallbackHz ?? DEFAULT_FALLBACK_HZ);
    this.now = options.now ?? (() => Date.now());
    this.timerFactory = options.timerFactory ?? createWorkerTimer;
    this.mode = supportsFrameCallback(this.media) ? 'per_frame' : 'fixed_100hz';
  }

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    if (this.mode === 'per_frame') {
      this.scheduleFrame();
    } else {
      this.timer = this.timerFactory(this.intervalMs, () => this.captureAtCurrentTime());
    }
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.rvfcHandle !== null) {
      asVideo(this.media).cancelVideoFrameCallback?.(this.rvfcHandle);
      this.rvfcHandle = null;
    }
    if (this.timer) {
      this.timer.stop();
      this.timer = null;
    }
  }

  dispose(): void {
    this.stop();
  }

  /**
   * Capture one sample at an explicit media time. Public so the frame-callback
   * path (and tests) can supply the callback's precise `mediaTime`.
   */
  captureAt(mediaTimeS: number): void {
    this.buffer.push({
      mediaTimeS,
      value: this.getValue(),
      wallClockMs: this.now(),
    });
  }

  private captureAtCurrentTime(): void {
    if (!this.running) return;
    this.captureAt(this.media.currentTime);
  }

  private scheduleFrame(): void {
    const video = asVideo(this.media);
    this.rvfcHandle = video.requestVideoFrameCallback((_now, metadata) => {
      if (!this.running) return;
      this.captureAt(metadata.mediaTime);
      this.scheduleFrame();
    });
  }
}

function asVideo(media: HTMLMediaElement): HTMLVideoElement {
  return media as HTMLVideoElement;
}

function supportsFrameCallback(media: HTMLMediaElement): boolean {
  return typeof asVideo(media).requestVideoFrameCallback === 'function';
}

/**
 * Whether this browser can drive per-frame video sampling. Lets callers (e.g. the
 * CSV exporter) resolve the sampling mode without holding the media element.
 */
export function supportsVideoFrameCallback(): boolean {
  return (
    typeof HTMLVideoElement !== 'undefined' &&
    typeof HTMLVideoElement.prototype.requestVideoFrameCallback === 'function'
  );
}

function createWorkerTimer(intervalMs: number, onTick: () => void): SamplingTimer {
  const worker = new Worker(new URL('./worker/samplerTimer.worker.ts', import.meta.url), {
    type: 'module',
  });
  worker.onmessage = (event: MessageEvent<{ type?: string }>) => {
    if (event.data?.type === 'tick') onTick();
  };
  worker.postMessage({ type: 'start', intervalMs });
  return {
    stop(): void {
      worker.postMessage({ type: 'stop' });
      worker.terminate();
    },
  };
}
