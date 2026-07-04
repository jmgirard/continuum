import type { ScaleConfig } from '../config/scale';

/**
 * Pure value ↔ position mapping for the rating scale. No React, no DOM — the
 * heart of the slider's correctness, and heavily unit-tested.
 *
 * Vocabulary:
 * - **value**: a number in the configured [min, max] domain. This is the true
 *   logical rating that gets sampled and exported.
 * - **fraction**: a normalized position in [0, 1] where 0 == min and 1 == max.
 * - **offset**: a normalized position in [0, 1] measured from the *top* of a
 *   vertical track (0 == top == max). Used directly for CSS `top`.
 */

/** Nudge for a continuous scale: 1% of the range per arrow press. */
const CONTINUOUS_KEY_STEP_FRACTION = 0.01;

/** True when the scale has discrete positions rather than a smooth range. */
export function isStepped(config: ScaleConfig): boolean {
  return config.steps !== 'continuous' && config.steps >= 2;
}

/** The spacing between adjacent discrete values; 0 for a continuous scale. */
export function stepSize(config: ScaleConfig): number {
  if (!isStepped(config)) return 0;
  const steps = config.steps as number;
  return (config.max - config.min) / (steps - 1);
}

/** Clamp a value into the configured [min, max] domain. */
export function clampValue(config: ScaleConfig, value: number): number {
  if (Number.isNaN(value)) return config.min;
  return Math.min(config.max, Math.max(config.min, value));
}

/** Snap a value to the nearest discrete step (identity for continuous), clamped. */
export function quantize(config: ScaleConfig, value: number): number {
  const clamped = clampValue(config, value);
  if (!isStepped(config)) return clamped;
  const size = stepSize(config);
  if (size === 0) return clamped;
  const stepsFromMin = Math.round((clamped - config.min) / size);
  // Guard against floating-point drift landing just outside the domain.
  return clampValue(config, config.min + stepsFromMin * size);
}

/** value → fraction in [0, 1] (0 == min, 1 == max). Degenerate range → 0. */
export function valueToFraction(config: ScaleConfig, value: number): number {
  const span = config.max - config.min;
  if (span === 0) return 0;
  const clamped = clampValue(config, value);
  return (clamped - config.min) / span;
}

/** fraction in [0, 1] → value, snapped to a step when the scale is stepped. */
export function fractionToValue(config: ScaleConfig, fraction: number): number {
  const clampedFraction = Math.min(1, Math.max(0, fraction));
  const raw = config.min + clampedFraction * (config.max - config.min);
  return quantize(config, raw);
}

/**
 * value → vertical offset from the top in [0, 1] (0 == top == max). Suitable for
 * a CSS `top` percentage on a track whose top edge is the scale maximum.
 */
export function valueToOffset(config: ScaleConfig, value: number): number {
  return 1 - valueToFraction(config, value);
}

/** vertical offset from the top in [0, 1] → value (inverse of valueToOffset). */
export function offsetToValue(config: ScaleConfig, offset: number): number {
  return fractionToValue(config, 1 - offset);
}

/**
 * The amount a single arrow-key press should change the value: one step for a
 * stepped scale, or 1% of the range for a continuous scale.
 */
export function keyboardStep(config: ScaleConfig): number {
  if (isStepped(config)) return stepSize(config);
  return (config.max - config.min) * CONTINUOUS_KEY_STEP_FRACTION;
}

/** Nudge a value by n steps (n may be negative), staying within the domain. */
export function nudge(config: ScaleConfig, value: number, steps: number): number {
  return quantize(config, value + steps * keyboardStep(config));
}

/** Format a value for display: integer when whole, else one decimal place. */
export function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
