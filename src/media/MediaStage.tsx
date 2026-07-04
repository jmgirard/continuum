import type { SamplingMode } from '../sampling/types';
import type { LoadedMedia } from './types';
import './media.css';

interface RecordingStatus {
  active: boolean;
  count: number;
  mode: SamplingMode | null;
}

interface MediaStageProps {
  media: LoadedMedia;
  attach: (el: HTMLMediaElement | null) => void;
  hasError: boolean;
  recording?: RecordingStatus;
}

function modeLabel(mode: SamplingMode | null): string {
  if (mode === 'per_frame') return 'per-frame';
  if (mode === 'fixed_100hz') return '100 Hz';
  return '';
}

/**
 * The media panel: a letterboxed <video> (or an audio placard for <audio>),
 * with the file name shown quietly in the corner. Playback controls live in the
 * transport bar below; this element is also the sampling source (M4). A small
 * capture indicator reports the live sample count.
 *
 * `controls` is intentionally omitted so transport is driven only by our bar
 * (respecting the transport lock); the native context menu download is disabled.
 */
export function MediaStage({ media, attach, hasError, recording }: MediaStageProps): JSX.Element {
  const showRec = recording && (recording.active || recording.count > 0);

  return (
    <div className="stage">
      {media.kind === 'video' ? (
        <video
          ref={attach}
          className="stage-video"
          src={media.url}
          aria-label={`Video: ${media.file.name}`}
          playsInline
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : (
        <div className="stage-audio">
          <audio ref={attach} src={media.url} aria-label={`Audio: ${media.file.name}`} />
          <div className="stage-audio-badge">AUDIO</div>
        </div>
      )}

      {hasError && (
        <div className="stage-error" role="alert">
          Playback failed — this file’s codec may be unsupported. Try an H.264/AAC MP4 or WebM.
        </div>
      )}

      <div className="stage-filename" title={media.file.name}>
        {media.file.name}
      </div>

      {showRec && (
        <div
          className={`stage-rec${recording.active ? ' stage-rec--on' : ''}`}
          aria-live="off"
          title="Samples captured this session"
        >
          <span className="stage-rec-dot" aria-hidden="true" />
          <span className="stage-rec-count">{recording.count.toLocaleString()}</span>
          <span className="stage-rec-label">samples</span>
          {recording.mode && <span className="stage-rec-mode">{modeLabel(recording.mode)}</span>}
        </div>
      )}
    </div>
  );
}
