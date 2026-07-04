import { useEffect, useRef, useState } from 'react';
import { MediaStage } from '../media/MediaStage';
import { TransportBar } from '../media/TransportBar';
import { useMediaElement } from '../media/useMediaElement';
import { useSpacebarPause } from '../media/useSpacebarPause';
import { VerticalSlider } from '../rating/VerticalSlider';
import { useSampling } from '../sampling/useSampling';
import { useAutosave } from '../session/useAutosave';
import type { SampleBuffer } from '../sampling/SampleBuffer';
import type { ScaleConfig } from '../config/scale';
import type { LoadedMedia } from '../media/types';
import './rating-view.css';

interface RatingViewProps {
  media: LoadedMedia;
  scale: ScaleConfig;
  transportLocked: boolean;
  /** The session's sample buffer (fresh or restored on resume). */
  buffer: SampleBuffer;
  /** Starting rating value (mid-scale for a new session; restored on resume). */
  initialRating: number;
  /** When the session was created (stable key for autosave). */
  createdAt: string;
  /** Focus mode: whether chrome should currently be faded. */
  chromeHidden: boolean;
  /** Report play/pause up so focus mode can track it. */
  onPlayingChange: (playing: boolean) => void;
}

/**
 * How far the "jump back" button rewinds. Backward-only recovery from a
 * distraction/mistake — there is no forward seek, so sections can't be skipped.
 * TODO(phase-3): make configurable in the study settings.
 */
const JUMP_BACK_SECONDS = 10;

/**
 * The participant rating screen: media panel + transport on the left, the rating
 * slider on the right. Sampling appends to the session buffer, which autosaves to
 * IndexedDB so an interrupted session can be resumed and re-exported.
 */
export function RatingView({
  media,
  scale,
  transportLocked,
  buffer,
  initialRating,
  createdAt,
  chromeHidden,
  onPlayingChange,
}: RatingViewProps): JSX.Element {
  const controller = useMediaElement(transportLocked);
  useSpacebarPause(controller.toggle, controller.element !== null);

  // Surface play/pause to the shell (drives focus mode); report paused on unmount.
  const isPlaying = controller.state.isPlaying;
  useEffect(() => {
    onPlayingChange(isPlaying);
  }, [isPlaying, onPlayingChange]);
  useEffect(() => () => onPlayingChange(false), [onPlayingChange]);

  // The current rating value drives the slider display; its mirror in valueRef is
  // the true logical value the sampling engine reads (no render per sample).
  const [value, setValue] = useState(initialRating);
  const valueRef = useRef(value);
  const handleChange = (next: number) => {
    valueRef.current = next;
    setValue(next);
  };

  const sampling = useSampling({
    buffer,
    element: controller.element,
    isPlaying: controller.state.isPlaying,
    getValue: () => valueRef.current,
  });

  useAutosave({
    buffer,
    scale,
    mediaReference: media.file.name,
    mediaKind: media.kind,
    createdAt,
    samplingMode: sampling.mode,
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
        <div className={`chrome-fade${chromeHidden ? ' chrome-fade--hidden' : ''}`}>
          <TransportBar
            state={controller.state}
            transportLocked={transportLocked}
            onToggle={controller.toggle}
            onJumpBack={() => controller.seek(controller.state.currentTime - JUMP_BACK_SECONDS)}
            jumpBackSeconds={JUMP_BACK_SECONDS}
          />
        </div>
      </div>

      <aside className="rating-col" aria-label="Rating control">
        <VerticalSlider config={scale} value={value} onChange={handleChange} />
      </aside>
    </div>
  );
}
