import type { LoadedMedia } from './types';
import './media.css';

interface MediaStageProps {
  media: LoadedMedia;
  attach: (el: HTMLMediaElement | null) => void;
  hasError: boolean;
}

/**
 * The media panel: a letterboxed <video> (or an audio placard for <audio>),
 * with the file name shown quietly in the corner. Playback controls live in the
 * transport bar below; this element is also the sampling source in milestone 4.
 *
 * `controls` is intentionally omitted so transport is driven only by our bar
 * (respecting the transport lock); the native context menu download is disabled.
 */
export function MediaStage({ media, attach, hasError }: MediaStageProps): JSX.Element {
  return (
    <div className="stage">
      {media.kind === 'video' ? (
        <video
          ref={attach}
          className="stage-video"
          src={media.url}
          playsInline
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : (
        <div className="stage-audio">
          <audio ref={attach} src={media.url} />
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
    </div>
  );
}
