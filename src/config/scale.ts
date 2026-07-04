import {
  DEFAULT_CUSTOM_STOPS,
  DEFAULT_PALETTE_ID,
  makeCustomPalette,
  PALETTES,
  type BuiltInPaletteId,
  type Palette,
} from './palettes';

/**
 * 1D rating-scale configuration. In Phase 1 this is a plain config object (the
 * spec allows "a simple settings panel or config object"); a researcher-facing
 * settings UI arrives in a later phase. It is also the source for the CSV
 * metadata header, so its fields map directly to the export contract.
 */
export interface ScaleConfig {
  /** Numeric value at the bottom of the slider. */
  readonly min: number;
  /** Numeric value at the top of the slider. */
  readonly max: number;
  /**
   * Number of discrete, evenly-spaced positions (>= 2), or 'continuous' for a
   * smooth scale. E.g. steps: 9 over 0..8 gives integer values 0,1,…,8.
   */
  readonly steps: number | 'continuous';
  readonly lowerLabel: string;
  readonly upperLabel: string;
  /** Optional dimension name shown alongside the track (e.g. "Valence"). */
  readonly axisLabel?: string;
  readonly paletteId: BuiltInPaletteId | 'custom';
  /** Colour stops when paletteId is 'custom'. */
  readonly customStops?: readonly string[];
  /** Phase 1 supports the vertical orientation only. */
  readonly orientation: 'vertical';
}

/** Default scale — the design handoff's valence example (0..8, 9 steps, CVD-safe). */
export const DEFAULT_SCALE: ScaleConfig = {
  min: 0,
  max: 8,
  steps: 9,
  lowerLabel: 'Very negative',
  upperLabel: 'Very positive',
  axisLabel: 'Valence',
  paletteId: DEFAULT_PALETTE_ID,
  orientation: 'vertical',
};

/** Resolve the configured palette to its colour stops. */
export function resolvePalette(config: ScaleConfig): Palette {
  if (config.paletteId === 'custom') {
    return makeCustomPalette(config.customStops ?? DEFAULT_CUSTOM_STOPS);
  }
  return PALETTES[config.paletteId];
}

/** The value used before the participant first moves the control (mid-scale). */
export function initialValue(config: ScaleConfig): number {
  return (config.min + config.max) / 2;
}
