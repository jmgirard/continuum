import { useState } from 'react';
import { MediaStage } from '../media/MediaStage';
import { TransportBar } from '../media/TransportBar';
import { useMediaElement } from '../media/useMediaElement';
import { useSpacebarPause } from '../media/useSpacebarPause';
import { VerticalSlider } from '../rating/VerticalSlider';
import { initialValue, type ScaleConfig } from '../config/scale';
import { quantize } from '../rating/scaleModel';
import type { LoadedMedia } from '../media/types';
import './rating-view.css';

interface RatingViewProps {
  media: LoadedMedia;
  scale: ScaleConfig;
  transportLocked: boolean;
}

/**
 * The participant rating screen: media panel + transport on the left, the rating
 * control column on the right (design's 1D layout). Milestone 2 wires the media
 * and transport; the vertical slider fills the rating column in milestone 3, and
 * per-frame sampling attaches to the media element in milestone 4.
 */
export function RatingView({ media, scale, transportLocked }: RatingViewProps): JSX.Element {
  const controller = useMediaElement(transportLocked);
  useSpacebarPause(controller.toggle, controller.element !== null);

  // The current rating value. In milestone 4 this becomes the source the sampling
  // engine records (mirrored into a ref); for now it drives the slider display.
  const [value, setValue] = useState(() => quantize(scale, initialValue(scale)));

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
        <VerticalSlider config={scale} value={value} onChange={setValue} />
      </aside>
    </div>
  );
}
