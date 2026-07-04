import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransportBar } from './TransportBar';
import type { TransportState } from './types';

const state: TransportState = {
  isPlaying: false,
  currentTime: 42,
  duration: 120,
  ended: false,
};

function renderBar(overrides: Partial<React.ComponentProps<typeof TransportBar>> = {}) {
  const onToggle = vi.fn();
  const onJumpBack = vi.fn();
  render(
    <TransportBar
      state={state}
      transportLocked={false}
      onToggle={onToggle}
      onJumpBack={onJumpBack}
      jumpBackSeconds={10}
      {...overrides}
    />,
  );
  return { onToggle, onJumpBack };
}

describe('<TransportBar />', () => {
  it('offers a backward jump and no forward/scrub control', () => {
    renderBar();
    expect(screen.getByRole('button', { name: 'Jump back 10 seconds' })).toBeInTheDocument();
    // Progress is display-only — a progressbar, never an interactive slider.
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  it('fires onJumpBack when the jump button is clicked', async () => {
    const { onJumpBack } = renderBar();
    await userEvent.click(screen.getByRole('button', { name: 'Jump back 10 seconds' }));
    expect(onJumpBack).toHaveBeenCalledTimes(1);
  });

  it('hides the jump-back button and shows "Seek disabled" when locked', () => {
    renderBar({ transportLocked: true });
    expect(screen.queryByRole('button', { name: /jump back/i })).not.toBeInTheDocument();
    expect(screen.getByText(/seek disabled/i)).toBeInTheDocument();
  });

  it('toggles play/pause', async () => {
    const { onToggle } = renderBar();
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
