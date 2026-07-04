/**
 * Rating-scale palettes.
 *
 * Defaults are perceptually-uniform and colourblind-safe (CVD-safe). The classic
 * red–yellow–green scale is deliberately excluded — it fails the most common
 * colour-vision deficiency. A fully custom 3-colour gradient stays available for
 * researchers, but is not contrast-guaranteed.
 *
 * Colour stops are transcribed from the Claude Design handoff ("Rating scale
 * palettes" section of the design-system sheet).
 */

export type PaletteKind = 'diverging' | 'sequential' | 'custom';

export interface Palette {
  readonly id: string;
  readonly name: string;
  readonly kind: PaletteKind;
  /** True for perceptually-uniform / colour-vision-deficiency-safe palettes. */
  readonly cvdSafe: boolean;
  /**
   * Ordered colour stops from scale minimum → maximum. Rendered low→high; a
   * vertical slider maps the last stop to the top (see `paletteGradient`).
   */
  readonly stops: readonly string[];
}

export const PALETTES = {
  blueGreyOrange: {
    id: 'blueGreyOrange',
    name: 'Blue → Grey → Orange',
    kind: 'diverging',
    cvdSafe: true,
    stops: ['#1f6cb0', '#4a86c5', '#8b9198', '#e0954e', '#d9702a'],
  },
  cividis: {
    id: 'cividis',
    name: 'Cividis',
    kind: 'sequential',
    cvdSafe: true,
    stops: ['#00204d', '#575d6d', '#a69d75', '#ffea46'],
  },
  viridis: {
    id: 'viridis',
    name: 'Viridis',
    kind: 'sequential',
    cvdSafe: true,
    stops: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
  },
} as const satisfies Record<string, Palette>;

export type BuiltInPaletteId = keyof typeof PALETTES;

/** The CVD-safe default used when a study does not specify one. */
export const DEFAULT_PALETTE_ID: BuiltInPaletteId = 'blueGreyOrange';

/** Fallback stops for the researcher's custom 3-colour option. */
export const DEFAULT_CUSTOM_STOPS = ['#1f6cb0', '#8b9198', '#d9702a'] as const;

export function makeCustomPalette(stops: readonly string[]): Palette {
  return {
    id: 'custom',
    name: 'Custom 3-colour',
    kind: 'custom',
    cvdSafe: false,
    stops,
  };
}

/**
 * Build a CSS `linear-gradient(...)` for a palette.
 *
 * @param direction 'to top' for the vertical slider (scale max at the top, the
 *   default), or any CSS gradient direction for swatches/previews.
 */
export function paletteGradient(palette: Palette, direction = 'to top'): string {
  return `linear-gradient(${direction}, ${palette.stops.join(', ')})`;
}
