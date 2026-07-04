import { useEffect, useState } from 'react';
import { useTheme } from './useTheme';
import { FileDropZone } from '../media/FileDropZone';
import { RatingView } from '../ui/RatingView';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ResumePrompt } from '../session/ResumePrompt';
import { useObjectUrl } from '../media/useObjectUrl';
import { clearSession, loadSession } from '../session/sessionStore';
import { SampleBuffer } from '../sampling/SampleBuffer';
import { supportsVideoFrameCallback } from '../sampling/samplingEngine';
import { buildCsv, downloadCsv, exportFilename } from '../export/csv';
import { DEFAULT_SCALE, initialValue, type ScaleConfig } from '../config/scale';
import { quantize } from '../rating/scaleModel';
import type { SessionRecord } from '../session/types';
import type { LoadedMedia, MediaKind } from '../media/types';
import './App.css';

interface Selection {
  file: File;
  kind: MediaKind;
}

/** The in-progress annotation: its buffer, scale, and identity. */
interface ActiveSession {
  buffer: SampleBuffer;
  scale: ScaleConfig;
  initialRating: number;
  createdAt: string;
  mediaReference: string;
}

function freshSession(file: File, scale: ScaleConfig): ActiveSession {
  return {
    buffer: new SampleBuffer(),
    scale,
    initialRating: quantize(scale, initialValue(scale)),
    createdAt: new Date().toISOString(),
    mediaReference: file.name,
  };
}

/**
 * Application shell and top-level screen switch: browse → rate. Owns the session
 * lifecycle so the sample buffer can be persisted (autosave) and restored
 * (resume). The rating slider, sampling, autosave, and export live below.
 */
export function App(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [transportLocked, setTransportLocked] = useState(false);
  const [confirmChangeOpen, setConfirmChangeOpen] = useState(false);

  // Autosaved session offered on load, and the "re-select the file" state after
  // choosing to resume it.
  const [resumeRecord, setResumeRecord] = useState<SessionRecord | null>(null);
  const [awaitingReselect, setAwaitingReselect] = useState(false);

  // Object URL lifecycle (created + revoked) is owned by the hook.
  const url = useObjectUrl(selection?.file ?? null);
  const media: LoadedMedia | null =
    selection && url ? { file: selection.file, url, kind: selection.kind } : null;

  // On load, offer to resume an autosaved session that has samples.
  useEffect(() => {
    let cancelled = false;
    void loadSession().then((record) => {
      if (!cancelled && record && record.samples.length > 0) setResumeRecord(record);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoad = (file: File, kind: MediaKind) => {
    if (awaitingReselect && session) {
      // Resuming: keep the restored buffer, just attach the re-selected file.
      setAwaitingReselect(false);
      setSelection({ file, kind });
      return;
    }
    setSession(freshSession(file, DEFAULT_SCALE));
    setSelection({ file, kind });
  };

  const handleResume = () => {
    const record = resumeRecord;
    if (!record) return;
    const buffer = new SampleBuffer();
    buffer.load(record.samples);
    setSession({
      buffer,
      scale: record.scale,
      initialRating: record.lastValue,
      createdAt: record.createdAt,
      mediaReference: record.mediaReference,
    });
    setAwaitingReselect(true);
    setResumeRecord(null);
  };

  const handleDiscardResume = () => {
    void clearSession();
    setResumeRecord(null);
  };

  const handleChangeFile = () => {
    void clearSession();
    setConfirmChangeOpen(false);
    setSelection(null);
    setSession(null);
    setAwaitingReselect(false);
  };

  const handleExport = () => {
    if (!session || !media) return;
    const samplingMode =
      media.kind === 'video' && supportsVideoFrameCallback() ? 'per_frame' : 'fixed_100hz';
    const csv = buildCsv({
      scale: session.scale,
      mediaReference: session.mediaReference,
      samplingMode,
      createdAt: session.createdAt,
      samples: session.buffer.snapshot(),
    });
    downloadCsv(exportFilename(session.mediaReference), csv);
  };

  const showRatingView = media && session && !awaitingReselect;

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

        {showRatingView && (
          <>
            <button
              type="button"
              className={`pill-toggle${transportLocked ? ' pill-toggle--on' : ''}`}
              onClick={() => setTransportLocked((v) => !v)}
              aria-pressed={transportLocked}
            >
              Transport {transportLocked ? 'locked' : 'free'}
            </button>
            <button type="button" className="pill-btn" onClick={handleExport}>
              Export CSV
            </button>
            <button type="button" className="text-btn" onClick={() => setConfirmChangeOpen(true)}>
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

      {showRatingView ? (
        <RatingView
          media={media}
          scale={session.scale}
          transportLocked={transportLocked}
          buffer={session.buffer}
          initialRating={session.initialRating}
          createdAt={session.createdAt}
        />
      ) : (
        <main className="app-body">
          <div className="dropzone-column">
            {awaitingReselect && session && (
              <p className="resume-notice" role="status">
                Resuming <strong>{session.mediaReference}</strong> —{' '}
                {session.buffer.length.toLocaleString()} sample
                {session.buffer.length === 1 ? '' : 's'} restored. Re-select the media file to
                continue.
              </p>
            )}
            <FileDropZone onLoad={({ file, kind }) => handleLoad(file, kind)} />
          </div>
        </main>
      )}

      {resumeRecord && (
        <ResumePrompt
          record={resumeRecord}
          onResume={handleResume}
          onDiscard={handleDiscardResume}
        />
      )}

      <ConfirmDialog
        open={confirmChangeOpen}
        title="Change media file?"
        message="This ends the current rating session and discards its ratings for this clip. This can’t be undone."
        confirmLabel="Change file"
        cancelLabel="Keep rating"
        destructive
        onConfirm={handleChangeFile}
        onCancel={() => setConfirmChangeOpen(false)}
      />
    </div>
  );
}
