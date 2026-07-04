import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MediaLoadError, TransportState } from './types';

export interface MediaController {
  /** Callback ref to attach to the <video>/<audio> element. */
  readonly attach: (el: HTMLMediaElement | null) => void;
  /** The live element, exposed so the sampling engine (milestone 4) can read it. */
  readonly element: HTMLMediaElement | null;
  readonly state: TransportState;
  readonly error: MediaLoadError | null;
  readonly play: () => void;
  readonly pause: () => void;
  readonly toggle: () => void;
  /** Seek to a media time in seconds. Ignored while transport is locked. */
  readonly seek: (timeSeconds: number) => void;
}

const INITIAL_STATE: TransportState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  ended: false,
};

/**
 * Own an HTML media element's transport state and expose imperative controls.
 *
 * The element is tracked as React state (via a callback ref) so the event-binding
 * effect re-runs whenever the underlying element mounts or changes. Display
 * updates ride the element's own `timeupdate` cadence (~4 Hz) — deliberately
 * decoupled from the high-rate sampling loop added in milestone 4.
 *
 * @param transportLocked when true, `seek` is a no-op and playback rate is pinned.
 */
export function useMediaElement(transportLocked: boolean): MediaController {
  const [element, setElement] = useState<HTMLMediaElement | null>(null);
  const [state, setState] = useState<TransportState>(INITIAL_STATE);
  const [error, setError] = useState<MediaLoadError | null>(null);

  const attach = useCallback((el: HTMLMediaElement | null) => {
    setElement(el);
    setState(INITIAL_STATE);
    setError(null);
  }, []);

  useEffect(() => {
    if (!element) return;

    const readDuration = () =>
      Number.isFinite(element.duration) && element.duration > 0 ? element.duration : 0;

    const onTimeUpdate = () => setState((s) => ({ ...s, currentTime: element.currentTime }));
    const onDurationChange = () => setState((s) => ({ ...s, duration: readDuration() }));
    const onPlay = () => setState((s) => ({ ...s, isPlaying: true, ended: false }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));
    const onEnded = () =>
      setState((s) => ({ ...s, isPlaying: false, ended: true, currentTime: element.currentTime }));
    const onError = () =>
      setError({
        kind: 'decode-failed',
        message:
          'This file could not be played. The browser may not support its codec — try an H.264/AAC MP4 or WebM.',
      });

    element.addEventListener('timeupdate', onTimeUpdate);
    element.addEventListener('durationchange', onDurationChange);
    element.addEventListener('loadedmetadata', onDurationChange);
    element.addEventListener('play', onPlay);
    element.addEventListener('pause', onPause);
    element.addEventListener('ended', onEnded);
    element.addEventListener('error', onError);

    return () => {
      element.removeEventListener('timeupdate', onTimeUpdate);
      element.removeEventListener('durationchange', onDurationChange);
      element.removeEventListener('loadedmetadata', onDurationChange);
      element.removeEventListener('play', onPlay);
      element.removeEventListener('pause', onPause);
      element.removeEventListener('ended', onEnded);
      element.removeEventListener('error', onError);
    };
  }, [element]);

  // Enforce the transport lock: pin playback rate so speed cannot be changed.
  useEffect(() => {
    if (element && transportLocked) element.playbackRate = 1;
  }, [element, transportLocked, state.isPlaying]);

  const play = useCallback(() => {
    void element?.play().catch(() => {
      // Autoplay/gesture rejections are non-fatal; the user can retry the button.
    });
  }, [element]);

  const pause = useCallback(() => element?.pause(), [element]);

  const toggle = useCallback(() => {
    if (!element) return;
    if (element.paused) play();
    else element.pause();
  }, [element, play]);

  const seek = useCallback(
    (timeSeconds: number) => {
      if (!element || transportLocked) return;
      const clamped = Math.max(0, Math.min(timeSeconds, element.duration || timeSeconds));
      element.currentTime = clamped;
      setState((s) => ({ ...s, currentTime: clamped }));
    },
    [element, transportLocked],
  );

  return useMemo(
    () => ({ attach, element, state, error, play, pause, toggle, seek }),
    [attach, element, state, error, play, pause, toggle, seek],
  );
}
