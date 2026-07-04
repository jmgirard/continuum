import { useRef } from 'react';
import { formatRemaining, formatTimecode, playbackFraction } from './mediaFile';
import type { TransportState } from './types';
import './media.css';

interface TransportBarProps {
  state: TransportState;
  transportLocked: boolean;
  onToggle: () => void;
  onSeek: (timeSeconds: number) => void;
}

const KEYBOARD_SEEK_STEP_S = 5;

/**
 * Transport controls beneath the media: play/pause, elapsed/remaining timecodes,
 * and a scrub bar. When `transportLocked` is set, seeking/scrubbing is disabled
 * (data integrity) and the bar shows a "Seek disabled" affordance — matching the
 * design's locked variant. Play/pause (and Space) remain available.
 */
export function TransportBar({
  state,
  transportLocked,
  onToggle,
  onSeek,
}: TransportBarProps): JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null);
  const { isPlaying, currentTime, duration } = state;
  const fraction = playbackFraction(currentTime, duration);

  const seekToClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track || duration <= 0) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  const onTrackPointerDown = (e: React.PointerEvent) => {
    if (transportLocked) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    seekToClientX(e.clientX);
  };

  const onTrackPointerMove = (e: React.PointerEvent) => {
    if (transportLocked || e.buttons === 0) return;
    seekToClientX(e.clientX);
  };

  const onTrackKeyDown = (e: React.KeyboardEvent) => {
    if (transportLocked) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSeek(currentTime - KEYBOARD_SEEK_STEP_S);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSeek(currentTime + KEYBOARD_SEEK_STEP_S);
    }
  };

  return (
    <div className="transport">
      <button
        type="button"
        className="transport-playpause"
        onClick={onToggle}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <span className="icon-pause" aria-hidden="true">
            <span />
            <span />
          </span>
        ) : (
          <span className="icon-play" aria-hidden="true" />
        )}
      </button>

      <span className="transport-time">{formatTimecode(currentTime)}</span>

      <div
        ref={trackRef}
        className={`transport-track${transportLocked ? ' transport-track--locked' : ''}`}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onKeyDown={onTrackKeyDown}
        role={transportLocked ? undefined : 'slider'}
        tabIndex={transportLocked ? -1 : 0}
        aria-label={transportLocked ? undefined : 'Seek'}
        aria-disabled={transportLocked || undefined}
        aria-valuemin={transportLocked ? undefined : 0}
        aria-valuemax={transportLocked ? undefined : Math.floor(duration)}
        aria-valuenow={transportLocked ? undefined : Math.floor(currentTime)}
        aria-valuetext={transportLocked ? undefined : formatTimecode(currentTime)}
      >
        <div className="transport-fill" style={{ width: `${fraction * 100}%` }} />
        {!transportLocked && (
          <div className="transport-handle" style={{ left: `${fraction * 100}%` }} />
        )}
      </div>

      <span className="transport-time transport-time--muted">
        {formatRemaining(currentTime, duration)}
      </span>

      <div className="transport-divider" />

      {transportLocked ? (
        <div className="transport-hint">
          <span className="icon-lock" aria-hidden="true" />
          <span>Seek disabled</span>
        </div>
      ) : (
        <div className="transport-hint">
          <kbd>SPACE</kbd>
          <span>pause</span>
        </div>
      )}
    </div>
  );
}
