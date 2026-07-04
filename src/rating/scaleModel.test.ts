import { describe, expect, it } from 'vitest';
import type { ScaleConfig } from '../config/scale';
import {
  clampValue,
  fractionToValue,
  formatValue,
  isStepped,
  keyboardStep,
  nudge,
  offsetToValue,
  quantize,
  stepSize,
  valueToFraction,
  valueToOffset,
} from './scaleModel';

const stepped9: ScaleConfig = {
  min: 0,
  max: 8,
  steps: 9,
  lowerLabel: 'lo',
  upperLabel: 'hi',
  paletteId: 'blueGreyOrange',
  orientation: 'vertical',
};

const diverging: ScaleConfig = {
  min: -100,
  max: 100,
  steps: 'continuous',
  lowerLabel: 'neg',
  upperLabel: 'pos',
  paletteId: 'viridis',
  orientation: 'vertical',
};

const stepped5over10: ScaleConfig = { ...stepped9, min: 0, max: 10, steps: 5 };

describe('isStepped / stepSize', () => {
  it('recognises stepped vs continuous', () => {
    expect(isStepped(stepped9)).toBe(true);
    expect(isStepped(diverging)).toBe(false);
  });

  it('computes spacing as range / (steps - 1)', () => {
    expect(stepSize(stepped9)).toBe(1); // 8 / 8
    expect(stepSize(stepped5over10)).toBe(2.5); // 10 / 4
    expect(stepSize(diverging)).toBe(0);
  });
});

describe('clampValue', () => {
  it('clamps into [min, max]', () => {
    expect(clampValue(stepped9, -3)).toBe(0);
    expect(clampValue(stepped9, 99)).toBe(8);
    expect(clampValue(diverging, 250)).toBe(100);
    expect(clampValue(diverging, -250)).toBe(-100);
  });

  it('maps NaN to min', () => {
    expect(clampValue(stepped9, Number.NaN)).toBe(0);
  });
});

describe('quantize', () => {
  it('snaps to the nearest step', () => {
    expect(quantize(stepped9, 6.2)).toBe(6);
    expect(quantize(stepped9, 6.6)).toBe(7);
    expect(quantize(stepped5over10, 3)).toBe(2.5);
    expect(quantize(stepped5over10, 4)).toBe(5);
  });

  it('is identity (clamped) for continuous scales', () => {
    expect(quantize(diverging, 42.3)).toBe(42.3);
    expect(quantize(diverging, 500)).toBe(100);
  });

  it('keeps snapped values inside the domain at the boundaries', () => {
    expect(quantize(stepped9, 7.9)).toBe(8);
    expect(quantize(stepped9, 0.4)).toBe(0);
  });
});

describe('valueToFraction / fractionToValue round-trip', () => {
  it('maps min→0 and max→1', () => {
    expect(valueToFraction(stepped9, 0)).toBe(0);
    expect(valueToFraction(stepped9, 8)).toBe(1);
    expect(valueToFraction(diverging, -100)).toBe(0);
    expect(valueToFraction(diverging, 0)).toBeCloseTo(0.5);
    expect(valueToFraction(diverging, 100)).toBe(1);
  });

  it('inverts cleanly on step centres', () => {
    for (let v = 0; v <= 8; v++) {
      expect(fractionToValue(stepped9, valueToFraction(stepped9, v))).toBe(v);
    }
  });

  it('clamps out-of-range fractions', () => {
    expect(fractionToValue(diverging, -0.5)).toBe(-100);
    expect(fractionToValue(diverging, 1.5)).toBe(100);
  });

  it('handles a degenerate zero-width range without dividing by zero', () => {
    const flat: ScaleConfig = { ...diverging, min: 5, max: 5 };
    expect(valueToFraction(flat, 5)).toBe(0);
    expect(fractionToValue(flat, 0.7)).toBe(5);
  });
});

describe('vertical offset mapping', () => {
  it('puts max at the top (offset 0) and min at the bottom (offset 1)', () => {
    expect(valueToOffset(stepped9, 8)).toBe(0);
    expect(valueToOffset(stepped9, 0)).toBe(1);
    expect(valueToOffset(stepped9, 4)).toBeCloseTo(0.5);
  });

  it('offsetToValue inverts valueToOffset', () => {
    expect(offsetToValue(stepped9, 0)).toBe(8);
    expect(offsetToValue(stepped9, 1)).toBe(0);
    expect(offsetToValue(diverging, 0.25)).toBeCloseTo(50);
  });
});

describe('keyboardStep / nudge', () => {
  it('nudges by one step on a stepped scale', () => {
    expect(keyboardStep(stepped9)).toBe(1);
    expect(nudge(stepped9, 4, 1)).toBe(5);
    expect(nudge(stepped9, 4, -1)).toBe(3);
  });

  it('nudges by 1% of range on a continuous scale', () => {
    expect(keyboardStep(diverging)).toBe(2); // 200 * 0.01
    expect(nudge(diverging, 0, 1)).toBe(2);
    expect(nudge(diverging, 0, -1)).toBe(-2);
  });

  it('clamps at the boundaries', () => {
    expect(nudge(stepped9, 8, 1)).toBe(8);
    expect(nudge(stepped9, 0, -1)).toBe(0);
  });
});

describe('formatValue', () => {
  it('shows integers without decimals and fractions with one', () => {
    expect(formatValue(6)).toBe('6');
    expect(formatValue(6.2)).toBe('6.2');
    expect(formatValue(-100)).toBe('-100');
  });
});
