import { useEffect, useState } from 'react';

/** Idle time before chrome fades during playback. */
const IDLE_MS = 2500;

/**
 * Focus / distraction-free mode. While media is playing, chrome (header,
 * transport) fades after a short idle so only the media and rating control
 * remain; it returns on any pointer move or key press, and whenever playback
 * pauses. Returns whether chrome should currently be hidden.
 */
export function useFocusMode(isPlaying: boolean): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!isPlaying) {
      setHidden(false);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      setHidden(false);
      timer = setTimeout(() => setHidden(true), IDLE_MS);
    };
    window.addEventListener('pointermove', arm);
    window.addEventListener('keydown', arm);
    arm();
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointermove', arm);
      window.removeEventListener('keydown', arm);
    };
  }, [isPlaying]);

  return hidden;
}
