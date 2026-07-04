import { useRef } from 'react';
import type { ScaleConfig } from '../config/scale';
import { resolvePalette } from '../config/scale';
import { paletteGradient } from '../config/palettes';
import {
  clampValue,
  formatValue,
  isStepped,
  nudge,
  offsetToValue,
  stepSize,
  valueToOffset,
} from './scaleModel';
import './rating.css';

interface VerticalSliderProps {
  config: ScaleConfig;
  value: number;
  onChange: (value: number) => void;
}

interface Tick {
  value: number;
  /** Offset from the top of the track in [0, 1]. */
  offset: number;
}

const MAX_RENDERED_STEP_TICKS = 15;
const FALLBACK_TICK_COUNT = 6;
const PAGE_STEP_MULTIPLIER = 5;

function buildTicks(config: ScaleConfig): Tick[] {
  if (isStepped(config) && (config.steps as number) <= MAX_RENDERED_STEP_TICKS) {
    const count = config.steps as number;
    const size = stepSize(config);
    const ticks: Tick[] = [];
    // Top (max) to bottom (min).
    for (let i = count - 1; i >= 0; i--) {
      const value = config.min + i * size;
      ticks.push({ value, offset: valueToOffset(config, value) });
    }
    return ticks;
  }

  const ticks: Tick[] = [];
  for (let i = 0; i < FALLBACK_TICK_COUNT; i++) {
    const offset = i / (FALLBACK_TICK_COUNT - 1);
    ticks.push({ value: offsetToValue(config, offset), offset });
  }
  return ticks;
}

/**
 * The 1D vertical rating slider (design's rating column). Operated by mouse drag
 * and keyboard arrows; the value it reports is the true logical rating that the
 * sampling engine records. Any damped motion/trail added later is display-only
 * and must not change the reported value.
 */
export function VerticalSlider({ config, value, onChange }: VerticalSliderProps): JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null);
  const palette = resolvePalette(config);
  const offset = valueToOffset(config, value);
  const ticks = buildTicks(config);
  const nearestTickValue = ticks.reduce((best, t) =>
    Math.abs(t.value - value) < Math.abs(best.value - value) ? t : best,
  ).value;

  const setFromClientY = (clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.height === 0) return;
    const raw = (clientY - rect.top) / rect.height;
    onChange(offsetToValue(config, raw));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClientY(e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    setFromClientY(e.clientY);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    let next: number | null = null;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        next = nudge(config, value, 1);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        next = nudge(config, value, -1);
        break;
      case 'PageUp':
        next = nudge(config, value, PAGE_STEP_MULTIPLIER);
        break;
      case 'PageDown':
        next = nudge(config, value, -PAGE_STEP_MULTIPLIER);
        break;
      case 'Home':
        next = config.min; // ARIA: Home → minimum
        break;
      case 'End':
        next = config.max; // ARIA: End → maximum
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange(clampValue(config, next));
  };

  const offsetPct = `${offset * 100}%`;

  return (
    <div className="slider">
      <div className="slider-label slider-label--upper">{config.upperLabel}</div>

      <div className="slider-body">
        <div className="slider-ticks" aria-hidden="true">
          {ticks.map((tick, i) => {
            const emphasised = tick.value === nearestTickValue;
            return (
              <div
                className={`slider-tick${emphasised ? ' slider-tick--on' : ''}`}
                style={{ top: `${tick.offset * 100}%` }}
                key={`${tick.value}-${i}`}
              >
                <span className="slider-tick-num">{formatValue(tick.value)}</span>
                <span className="slider-tick-line" />
              </div>
            );
          })}
        </div>

        <div
          ref={trackRef}
          className="slider-track"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
        >
          <div
            className="slider-gradient"
            style={{ background: paletteGradient(palette) }}
            aria-hidden="true"
          />

          <div
            className="slider-handle"
            style={{ top: offsetPct }}
            role="slider"
            tabIndex={0}
            aria-label={config.axisLabel ?? 'Rating'}
            aria-orientation="vertical"
            aria-valuemin={config.min}
            aria-valuemax={config.max}
            aria-valuenow={value}
            aria-valuetext={`${formatValue(value)} (${config.lowerLabel} to ${config.upperLabel})`}
            onKeyDown={onKeyDown}
          >
            <span className="slider-handle-grip" aria-hidden="true" />
          </div>

          <div className="slider-bubble" style={{ top: offsetPct }} aria-hidden="true">
            <span className="slider-bubble-value">{formatValue(value)}</span>
            <span className="slider-bubble-max">/ {formatValue(config.max)}</span>
          </div>
        </div>

        {config.axisLabel && (
          <div className="slider-axis" aria-hidden="true">
            <span>{config.axisLabel}</span>
          </div>
        )}
      </div>

      <div className="slider-label slider-label--lower">{config.lowerLabel}</div>

      <div className="slider-hint" aria-hidden="true">
        <span>DRAG</span>
        <span className="slider-hint-dot">·</span>
        <span>↑ ↓ KEYS</span>
      </div>
    </div>
  );
}
