import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFocusMode } from './useFocusMode';

describe('useFocusMode', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('keeps chrome visible while paused', () => {
    const { result } = renderHook(({ playing }) => useFocusMode(playing), {
      initialProps: { playing: false },
    });
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(false);
  });

  it('hides chrome after an idle period while playing', () => {
    const { result } = renderHook(({ playing }) => useFocusMode(playing), {
      initialProps: { playing: true },
    });
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current).toBe(true);
  });

  it('reveals chrome on pointer activity, then hides again', () => {
    const { result } = renderHook(({ playing }) => useFocusMode(playing), {
      initialProps: { playing: true },
    });
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current).toBe(true);

    act(() => window.dispatchEvent(new Event('pointermove')));
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current).toBe(true);
  });

  it('restores chrome immediately when playback pauses', () => {
    const { result, rerender } = renderHook(({ playing }) => useFocusMode(playing), {
      initialProps: { playing: true },
    });
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current).toBe(true);

    rerender({ playing: false });
    expect(result.current).toBe(false);
  });
});
