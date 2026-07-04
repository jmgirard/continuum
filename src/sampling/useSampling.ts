import { useEffect, useRef, useState } from 'react';
import { SampleBuffer } from './SampleBuffer';
import { SamplingEngine } from './samplingEngine';
import type { SamplingMode } from './types';

/** How often the growing buffer size is reflected into React (display only). */
const COUNT_POLL_MS = 200;

export interface SamplingState {
  /** The live buffer (stable across renders). */
  readonly buffer: SampleBuffer;
  readonly sampleCount: number;
  readonly isSampling: boolean;
  readonly mode: SamplingMode | null;
}

interface UseSamplingParams {
  element: HTMLMediaElement | null;
  isPlaying: boolean;
  /** Reads the current true logical rating value without causing re-renders. */
  getValue: () => number;
}

/**
 * Wire the sampling engine to playback. Sampling starts on play and stops on
 * pause/end; the sample buffer lives in a ref so per-frame writes never render.
 * Only the sample *count* is surfaced to React, on a throttled interval, for a
 * lightweight live readout.
 */
export function useSampling({ element, isPlaying, getValue }: UseSamplingParams): SamplingState {
  const bufferRef = useRef<SampleBuffer>(new SampleBuffer());
  const engineRef = useRef<SamplingEngine | null>(null);

  // Keep the latest getValue without re-creating the engine each render.
  const getValueRef = useRef(getValue);
  getValueRef.current = getValue;

  const [sampleCount, setSampleCount] = useState(0);
  const [isSampling, setIsSampling] = useState(false);
  const [mode, setMode] = useState<SamplingMode | null>(null);

  // A new media element is a new session: rebuild the engine and clear samples.
  useEffect(() => {
    engineRef.current?.dispose();
    engineRef.current = null;
    if (!element) {
      setMode(null);
      return;
    }
    bufferRef.current.clear();
    setSampleCount(0);
    const engine = new SamplingEngine({
      media: element,
      getValue: () => getValueRef.current(),
      buffer: bufferRef.current,
    });
    engineRef.current = engine;
    setMode(engine.mode);
    return () => engine.dispose();
  }, [element]);

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
      setSampleCount(bufferRef.current.length);
    }
  }, [isPlaying, element]);

  // Throttled display path: reflect buffer growth into React while sampling.
  useEffect(() => {
    if (!isSampling) return;
    const id = setInterval(() => setSampleCount(bufferRef.current.length), COUNT_POLL_MS);
    return () => clearInterval(id);
  }, [isSampling]);

  return { buffer: bufferRef.current, sampleCount, isSampling, mode };
}
