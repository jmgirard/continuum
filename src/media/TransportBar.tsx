import { formatRemaining, formatTimecode, playbackFraction } from './mediaFile';
import type { TransportState } from './types';
import './media.css';

interface TransportBarProps {
  state: TransportState;
  transportLocked: boolean;
  onToggle: () => void;
  onJumpBack: () => void;
  jumpBackSeconds: number;
}

/**
 * Transport controls beneath the media: play/pause, a backward "jump back"
 * button, elapsed/remaining timecodes, and a display-only progress bar.
 *
 * There is deliberately NO free scrubbing and NO forward seek — a participant
 * must not be able to skip sections of the media (that would leave gaps in the
 * continuous rating). The only seek is the backward jump, for recovering from a
 * distraction or mistake. When `transportLocked` is set, even that is disabled
 * (strictest mode); play/pause (and Space) always remain.
 */
export function TransportBar({
  state,
  transportLocked,
  onToggle,
  onJumpBack,
  jumpBackSeconds,
}: TransportBarProps): JSX.Element {
  const { isPlaying, currentTime, duration } = state;
  const fraction = playbackFraction(currentTime, duration);

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

      {!transportLocked && (
        <button
          type="button"
          className="transport-jumpback"
          onClick={onJumpBack}
          aria-label={`Jump back ${jumpBackSeconds} seconds`}
          title={`Jump back ${jumpBackSeconds}s`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M6 1 L1 6 L6 11 Z" fill="currentColor" />
            <path d="M11 1 L6 6 L11 11 Z" fill="currentColor" />
          </svg>
          <span className="transport-jumpback-label">{jumpBackSeconds}s</span>
        </button>
      )}

      <span className="transport-time">{formatTimecode(currentTime)}</span>

      {/* Display-only progress — not interactive (no scrubbing). */}
      <div
        className={`transport-track transport-track--display${
          transportLocked ? ' transport-track--locked' : ''
        }`}
        role="progressbar"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={Math.floor(duration)}
        aria-valuenow={Math.floor(currentTime)}
        aria-valuetext={formatTimecode(currentTime)}
      >
        <div className="transport-fill" style={{ width: `${fraction * 100}%` }} />
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
