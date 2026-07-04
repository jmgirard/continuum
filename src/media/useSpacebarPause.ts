import { useEffect } from 'react';

/** Elements for which Space has its own meaning and must not toggle playback. */
function spaceIsClaimed(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'BUTTON' ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

/**
 * Bind Space (globally) to toggle playback, matching the design's "SPACE · pause"
 * affordance. Skips the toggle when focus is on a control that uses Space itself
 * (buttons, inputs), so the play button doesn't fire twice.
 */
export function useSpacebarPause(toggle: () => void, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      if (spaceIsClaimed(e.target)) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle, enabled]);
}
