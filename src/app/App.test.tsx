import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

describe('<App /> shell', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
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
});
