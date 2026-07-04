import { useEffect, useRef } from 'react';
import { saveSession } from './sessionStore';
import { APP_VERSION } from '../config/appInfo';
import type { SampleBuffer } from '../sampling/SampleBuffer';
import type { ScaleConfig } from '../config/scale';
import type { MediaKind } from '../media/types';
import type { SamplingMode } from '../sampling/types';

/** How often to flush the session to IndexedDB while ratings accrue. */
const AUTOSAVE_INTERVAL_MS = 4000;

export interface AutosaveParams {
  buffer: SampleBuffer;
  scale: ScaleConfig;
  mediaReference: string;
  mediaKind: MediaKind;
  createdAt: string;
  samplingMode: SamplingMode | null;
  /** Reads the current logical rating value (for restoring on resume). */
  getValue: () => number;
}

/**
 * Continuously persist the in-progress session to IndexedDB. Runs on an interval
 * plus on tab-hide/unload, and flushes once more on unmount. Reads a buffer
 * snapshot (a cheap array copy) off the sampling path, so it never stalls the
 * sampling loop. Only writes when the sample count changed since the last save
 * (the final flush always writes, to capture a trailing value change).
 */
export function useAutosave(params: AutosaveParams): void {
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const lastSavedLengthRef = useRef(-1);

  useEffect(() => {
    const save = (): void => {
      const p = paramsRef.current;
      lastSavedLengthRef.current = p.buffer.length;
      void saveSession({
        appVersion: APP_VERSION,
        mediaReference: p.mediaReference,
        mediaKind: p.mediaKind,
        scale: p.scale,
        samplingMode: p.samplingMode,
        samples: p.buffer.snapshot(),
        lastValue: p.getValue(),
        createdAt: p.createdAt,
        updatedAt: new Date().toISOString(),
      }).catch(() => {
        // Autosave is best-effort; a failed write must not disrupt rating.
      });
    };

    // Persist the config immediately so a session is resumable even before the
    // first sample lands.
    save();

    const intervalId = setInterval(() => {
      if (paramsRef.current.buffer.length !== lastSavedLengthRef.current) save();
    }, AUTOSAVE_INTERVAL_MS);

    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') save();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', save);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', save);
      save();
    };
    // A new session (new createdAt) restarts the autosave lifecycle.
  }, [params.createdAt]);
}
