import { MediaStage } from '../media/MediaStage';
import { TransportBar } from '../media/TransportBar';
import { useMediaElement } from '../media/useMediaElement';
import { useSpacebarPause } from '../media/useSpacebarPause';
import type { LoadedMedia } from '../media/types';
import './rating-view.css';

interface RatingViewProps {
  media: LoadedMedia;
  transportLocked: boolean;
}

/**
 * The participant rating screen: media panel + transport on the left, the rating
 * control column on the right (design's 1D layout). Milestone 2 wires the media
 * and transport; the vertical slider fills the rating column in milestone 3, and
 * per-frame sampling attaches to the media element in milestone 4.
 */
export function RatingView({ media, transportLocked }: RatingViewProps): JSX.Element {
  const controller = useMediaElement(transportLocked);
  useSpacebarPause(controller.toggle, controller.element !== null);

  return (
    <div className="rating-view">
      <div className="media-col">
        <MediaStage media={media} attach={controller.attach} hasError={controller.error !== null} />
        <TransportBar
          state={controller.state}
          transportLocked={transportLocked}
          onToggle={controller.toggle}
          onSeek={controller.seek}
        />
      </div>

      <aside className="rating-col" aria-label="Rating control">
        {/* TODO(milestone-3): vertical rating slider mounts here. */}
        <div className="rating-col-placeholder">
          <span className="rating-col-placeholder-label">Rating slider</span>
          <span className="rating-col-placeholder-sub">milestone 3</span>
        </div>
      </aside>
    </div>
  );
}
