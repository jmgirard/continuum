import { useEffect, useRef, useState } from 'react';
import { SamplingEngine } from './samplingEngine';
import type { SampleBuffer } from './SampleBuffer';
import type { SamplingMode } from './types';

/** How often the growing buffer size is reflected into React (display only). */
const COUNT_POLL_MS = 200;

export interface SamplingState {
  readonly sampleCount: number;
  readonly isSampling: boolean;
  readonly mode: SamplingMode | null;
}

interface UseSamplingParams {
  /** The session's sample buffer (owned by the caller; may be preloaded on resume). */
  buffer: SampleBuffer;
  element: HTMLMediaElement | null;
  isPlaying: boolean;
  /** Reads the current true logical rating value without causing re-renders. */
  getValue: () => number;
}

/**
 * Wire the sampling engine to playback. Sampling starts on play and stops on
 * pause/end; samples are appended to the caller-owned buffer, so per-frame writes
 * never render and a resumed buffer keeps accumulating (indices continue). Only
 * the sample *count* is surfaced to React, on a throttled interval.
 *
 * The buffer is not cleared here — its lifecycle (fresh vs. resumed) is owned by
 * the session above, which passes a new buffer instance to start a new session.
 */
export function useSampling({
  buffer,
  element,
  isPlaying,
  getValue,
}: UseSamplingParams): SamplingState {
  const engineRef = useRef<SamplingEngine | null>(null);

  // Keep the latest getValue without re-creating the engine each render.
  const getValueRef = useRef(getValue);
  getValueRef.current = getValue;

  const [sampleCount, setSampleCount] = useState(buffer.length);
  const [isSampling, setIsSampling] = useState(false);
  const [mode, setMode] = useState<SamplingMode | null>(null);

  // Build the engine for the current media element + buffer.
  useEffect(() => {
    engineRef.current?.dispose();
    engineRef.current = null;
    if (!element) {
      setMode(null);
      return;
    }
    const engine = new SamplingEngine({
      media: element,
      getValue: () => getValueRef.current(),
      buffer,
    });
    engineRef.current = engine;
    setMode(engine.mode);
    setSampleCount(buffer.length);
    return () => engine.dispose();
  }, [element, buffer]);

  // Start/stop with playback.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (isPlaying) {
      engine.start();
      setIsSampling(true);
    } else {
      engine.stop();
      setIsSampling(false);
      setSampleCount(buffer.length);
    }
  }, [isPlaying, element, buffer]);

  // Throttled display path: reflect buffer growth into React while sampling.
  useEffect(() => {
    if (!isSampling) return;
    const id = setInterval(() => setSampleCount(buffer.length), COUNT_POLL_MS);
    return () => clearInterval(id);
  }, [isSampling, buffer]);

  return { sampleCount, isSampling, mode };
}
