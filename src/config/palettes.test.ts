import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CUSTOM_STOPS,
  DEFAULT_PALETTE_ID,
  makeCustomPalette,
  paletteGradient,
  PALETTES,
} from './palettes';

describe('palettes', () => {
  it('exposes the CVD-safe blue→grey→orange default', () => {
    expect(DEFAULT_PALETTE_ID).toBe('blueGreyOrange');
    expect(PALETTES.blueGreyOrange.cvdSafe).toBe(true);
    expect(PALETTES.blueGreyOrange.kind).toBe('diverging');
  });

  it('marks every built-in palette CVD-safe', () => {
    for (const palette of Object.values(PALETTES)) {
      expect(palette.cvdSafe).toBe(true);
      expect(palette.stops.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('builds a bottom→top gradient for the vertical slider by default', () => {
    const gradient = paletteGradient(PALETTES.blueGreyOrange);
    expect(gradient).toBe('linear-gradient(to top, #1f6cb0, #4a86c5, #8b9198, #e0954e, #d9702a)');
  });

  it('honours a custom gradient direction', () => {
    expect(paletteGradient(PALETTES.cividis, 'to right')).toContain('to right,');
  });

  it('creates a non-CVD-safe custom palette from stops', () => {
    const custom = makeCustomPalette(DEFAULT_CUSTOM_STOPS);
    expect(custom.kind).toBe('custom');
    expect(custom.cvdSafe).toBe(false);
    expect(custom.stops).toEqual(['#1f6cb0', '#8b9198', '#d9702a']);
  });
});
