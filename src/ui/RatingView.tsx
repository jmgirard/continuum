import { useRef, useState } from 'react';
import { MediaStage } from '../media/MediaStage';
import { TransportBar } from '../media/TransportBar';
import { useMediaElement } from '../media/useMediaElement';
import { useSpacebarPause } from '../media/useSpacebarPause';
import { VerticalSlider } from '../rating/VerticalSlider';
import { useSampling } from '../sampling/useSampling';
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
 * How far the "jump back" button rewinds. Backward-only recovery from a
 * distraction/mistake — there is no forward seek, so sections can't be skipped.
 * TODO(phase-3): make configurable in the study settings.
 */
const JUMP_BACK_SECONDS = 10;

/**
 * The participant rating screen: media panel + transport on the left, the rating
 * control column on the right (design's 1D layout). Media + transport (M2), the
 * vertical slider (M3), and per-frame sampling attached to the media element (M4).
 */
export function RatingView({ media, scale, transportLocked }: RatingViewProps): JSX.Element {
  const controller = useMediaElement(transportLocked);
  useSpacebarPause(controller.toggle, controller.element !== null);

  // The current rating value drives the slider display; its mirror in valueRef is
  // the true logical value the sampling engine reads (no render per sample).
  const [value, setValue] = useState(() => quantize(scale, initialValue(scale)));
  const valueRef = useRef(value);
  const handleChange = (next: number) => {
    valueRef.current = next;
    setValue(next);
  };

  const sampling = useSampling({
    element: controller.element,
    isPlaying: controller.state.isPlaying,
    getValue: () => valueRef.current,
  });

  return (
    <div className="rating-view">
      <div className="media-col">
        <MediaStage
          media={media}
          attach={controller.attach}
          hasError={controller.error !== null}
          recording={{
            active: sampling.isSampling,
            count: sampling.sampleCount,
            mode: sampling.mode,
          }}
        />
        <TransportBar
          state={controller.state}
          transportLocked={transportLocked}
          onToggle={controller.toggle}
          onJumpBack={() => controller.seek(controller.state.currentTime - JUMP_BACK_SECONDS)}
          jumpBackSeconds={JUMP_BACK_SECONDS}
        />
      </div>

      <aside className="rating-col" aria-label="Rating control">
        <VerticalSlider config={scale} value={value} onChange={handleChange} />
      </aside>
    </div>
  );
}
