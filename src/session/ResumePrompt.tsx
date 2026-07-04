import { useEffect, useRef } from 'react';
import { formatTimecode } from '../media/mediaFile';
import type { SessionRecord } from './types';
import '../ui/confirm-dialog.css';

interface ResumePromptProps {
  record: SessionRecord;
  onResume: () => void;
  onDiscard: () => void;
}

function formatAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'recently';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * Offered on load when an autosaved session exists. Deliberately NOT dismissible
 * by Escape or backdrop click — the only exits are the two explicit choices, so
 * a stray keypress can't discard the participant's ratings. Escape defaults to
 * the safe action (resume).
 */
export function ResumePrompt({ record, onResume, onDiscard }: ResumePromptProps): JSX.Element {
  const resumeRef = useRef<HTMLButtonElement>(null);
  const lastMediaTime = record.samples.at(-1)?.mediaTimeS ?? 0;

  useEffect(() => {
    resumeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onResume(); // Escape = keep my data
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onResume]);

  return (
    <div className="modal-overlay">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-title"
        aria-describedby="resume-message"
      >
        <h2 id="resume-title" className="modal-title">
          Resume your session?
        </h2>
        <p id="resume-message" className="modal-message">
          An autosaved session was found for <strong>{record.mediaReference}</strong> —{' '}
          {record.samples.length.toLocaleString()} sample
          {record.samples.length === 1 ? '' : 's'}, up to {formatTimecode(lastMediaTime)}, saved{' '}
          {formatAgo(record.updatedAt)}. Resume to keep your ratings (you’ll re-select the media
          file), or discard to start over.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onDiscard}>
            Discard
          </button>
          <button ref={resumeRef} type="button" className="btn-primary" onClick={onResume}>
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}
