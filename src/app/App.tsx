import { useState } from 'react';
import { useTheme } from './useTheme';
import { FileDropZone } from '../media/FileDropZone';
import { RatingView } from '../ui/RatingView';
import { useObjectUrl } from '../media/useObjectUrl';
import type { LoadedMedia, MediaKind } from '../media/types';
import './App.css';

interface Selection {
  file: File;
  kind: MediaKind;
}

/**
 * Application shell and top-level screen switch.
 *
 * Milestone 2: Browse-to-load a local media file, then show the rating screen
 * with a working media panel and transport (play/pause, spacebar, seek, and the
 * transport-lock variant). The rating slider, sampling, autosave, and export
 * arrive in later milestones.
 */
export function App(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [transportLocked, setTransportLocked] = useState(false);

  // Object URL lifecycle (created + revoked) is owned by the hook.
  const url = useObjectUrl(selection?.file ?? null);
  const media: LoadedMedia | null =
    selection && url ? { file: selection.file, url, kind: selection.kind } : null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <div className="app-logo" aria-hidden="true" />
          <span className="app-brand-name">Continuum</span>
          <span className="app-sep">/</span>
          <span className="app-subtitle">
            {media ? media.file.name : 'Continuous rating instrument'}
          </span>
        </div>
        <div className="app-spacer" />

        {media && (
          <>
            <button
              type="button"
              className={`pill-toggle${transportLocked ? ' pill-toggle--on' : ''}`}
              onClick={() => setTransportLocked((v) => !v)}
              aria-pressed={transportLocked}
            >
              Transport {transportLocked ? 'locked' : 'free'}
            </button>
            <button type="button" className="text-btn" onClick={() => setSelection(null)}>
              Change file
            </button>
          </>
        )}

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          <span className="theme-toggle-dot" aria-hidden="true" />
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
        <span className="app-badge">1D</span>
      </header>

      {media ? (
        <RatingView media={media} transportLocked={transportLocked} />
      ) : (
        <main className="app-body">
          <FileDropZone onLoad={setSelection} />
        </main>
      )}
    </div>
  );
}
