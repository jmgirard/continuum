import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { clearSession, saveSession } from '../session/sessionStore';
import type { SessionRecord } from '../session/types';

const savedRecord: SessionRecord = {
  appVersion: '0.1.0',
  mediaReference: 'clip_02_interview.webm',
  mediaKind: 'video',
  scale: {
    min: 0,
    max: 8,
    steps: 9,
    lowerLabel: 'Very negative',
    upperLabel: 'Very positive',
    axisLabel: 'Valence',
    paletteId: 'blueGreyOrange',
    orientation: 'vertical',
  },
  samplingMode: 'per_frame',
  samples: [
    { sampleIndex: 0, mediaTimeS: 0, value: 4, wallClockMs: 1000 },
    { sampleIndex: 1, mediaTimeS: 0.033, value: 5, wallClockMs: 1033 },
  ],
  lastValue: 5,
  createdAt: '2026-07-05T10:00:00.000Z',
  updatedAt: '2026-07-05T10:02:00.000Z',
};

describe('<App /> shell', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    await clearSession();
  });

  it('renders the brand, the file browse prompt, and defaults to the dark theme', () => {
    render(<App />);
    expect(screen.getByText('Continuum')).toBeInTheDocument();
    expect(screen.getByText(/load a media file to rate/i)).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles between dark and light themes', async () => {
    const user = userEvent.setup();
    render(<App />);

    const toggle = screen.getByRole('button', { name: /switch to light theme/i });
    await user.click(toggle);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('continuum.theme')).toBe('light');
  });

  it('guards "Change file" with a confirmation and only clears media on confirm', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Load a media file through the hidden file input.
    const file = new File(['x'], 'clip.webm', { type: 'video/webm' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    // Rating view is shown for the loaded file.
    expect(await screen.findByRole('slider', { name: 'Valence' })).toBeInTheDocument();

    // Clicking "Change file" does NOT immediately clear — it asks first.
    await user.click(screen.getByRole('button', { name: 'Change file' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Keeping the rating dismisses the dialog and preserves the loaded media.
    await user.click(screen.getByRole('button', { name: 'Keep rating' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Valence' })).toBeInTheDocument();

    // Confirming discards the media and returns to the browse state.
    await user.click(screen.getByRole('button', { name: 'Change file' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Change file' }));
    // After confirm, the dialog is gone and the drop prompt is back.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/load a media file to rate/i)).toBeInTheDocument();
  });

  it('offers to resume an autosaved session and shows the re-select notice', async () => {
    const user = userEvent.setup();
    await saveSession(savedRecord);
    render(<App />);

    // The resume prompt appears with the saved file and sample count.
    const prompt = await screen.findByRole('dialog', { name: /resume your session/i });
    expect(within(prompt).getByText('clip_02_interview.webm')).toBeInTheDocument();

    // Resuming asks the participant to re-select the file, noting samples restored.
    await user.click(within(prompt).getByRole('button', { name: 'Resume' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/2 samples restored/i)).toBeInTheDocument();
    expect(screen.getByText(/load a media file to rate/i)).toBeInTheDocument();
  });

  it('discards an autosaved session on request', async () => {
    const user = userEvent.setup();
    await saveSession(savedRecord);
    render(<App />);

    const prompt = await screen.findByRole('dialog', { name: /resume your session/i });
    await user.click(within(prompt).getByRole('button', { name: 'Discard' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await loadSessionSafely()).toBeUndefined();
  });
});

async function loadSessionSafely() {
  const { loadSession } = await import('../session/sessionStore');
  return loadSession();
}
