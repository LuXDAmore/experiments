import { describe, it, expect } from 'vitest';
import {
  PALETTE,
  lerp, lenisEasing,
  toRgb, toHex,
  findSegmentIndex, lerpPalette,
  calcSunY, calcSunSize, calcGlowBurst, calcGlowValue,
  stepCursorRing, mouseToNDC,
} from './utils.js';

// ── lerp ─────────────────────────────────────────────────────────────────

describe('lerp', () => {
  it('returns x at f = 0', () => {
    expect(lerp(0, 10, 0)).toBe(0);
  });

  it('returns y at f = 1', () => {
    expect(lerp(0, 10, 1)).toBe(10);
  });

  it('returns midpoint at f = 0.5', () => {
    expect(lerp(0, 20, 0.5)).toBe(10);
  });

  it('handles negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });
});

// ── lenisEasing ──────────────────────────────────────────────────────────

describe('lenisEasing', () => {
  it('returns near-zero (~0.001) at t = 0', () => {
    // The 1.001 offset in the formula means the curve starts at 0.001, not exactly 0
    expect(lenisEasing(0)).toBeCloseTo(0.001, 5);
    expect(lenisEasing(0)).toBeLessThan(0.01);
  });

  it('returns 1 at t = 1', () => {
    expect(lenisEasing(1)).toBe(1);
  });

  it('never exceeds 1', () => {
    [0, 0.5, 1, 2, 10].forEach(t => {
      expect(lenisEasing(t)).toBeLessThanOrEqual(1);
    });
  });
});

// ── toRgb ─────────────────────────────────────────────────────────────────

describe('toRgb', () => {
  it('converts pure red (1, 0, 0) to rgb(255,0,0)', () => {
    expect(toRgb([1, 0, 0])).toBe('rgb(255,0,0)');
  });

  it('converts black (0, 0, 0) to rgb(0,0,0)', () => {
    expect(toRgb([0, 0, 0])).toBe('rgb(0,0,0)');
  });

  it('converts white (1, 1, 1) to rgb(255,255,255)', () => {
    expect(toRgb([1, 1, 1])).toBe('rgb(255,255,255)');
  });

  it('rounds fractional values correctly', () => {
    // 0.5 * 255 = 127.5 → rounds to 128
    const result = toRgb([0.5, 0.5, 0.5]);
    expect(result).toBe('rgb(128,128,128)');
  });

  it('returns a string matching the rgb(...) pattern', () => {
    const result = toRgb([0.2, 0.4, 0.6]);
    expect(result).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });
});

// ── toHex ─────────────────────────────────────────────────────────────────

describe('toHex', () => {
  it('converts pure red (1, 0, 0) to #ff0000', () => {
    expect(toHex([1, 0, 0])).toBe('#ff0000');
  });

  it('converts black (0, 0, 0) to #000000', () => {
    expect(toHex([0, 0, 0])).toBe('#000000');
  });

  it('converts white (1, 1, 1) to #ffffff', () => {
    expect(toHex([1, 1, 1])).toBe('#ffffff');
  });

  it('pads single-character hex digits with a leading zero', () => {
    // 0.039 * 255 ≈ 9.945 → rounds to 10 → '0a' (not 'a')
    const result = toHex([0, 0.039, 0]);
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
    expect(result.length).toBe(7); // # + 6 hex chars
  });

  it('always returns a 7-character string', () => {
    expect(toHex([0.1, 0.2, 0.3])).toHaveLength(7);
    expect(toHex([0.9, 0.8, 0.7])).toHaveLength(7);
  });

  it('starts with #', () => {
    expect(toHex([0.5, 0.5, 0.5])[0]).toBe('#');
  });
});

// ── findSegmentIndex ──────────────────────────────────────────────────────

describe('findSegmentIndex', () => {
  const stops = [0, 0.25, 0.5, 0.75, 1];

  it('returns 0 for t = 0 (first segment)', () => {
    expect(findSegmentIndex(0, stops)).toBe(0);
  });

  it('returns 0 for t just above 0', () => {
    expect(findSegmentIndex(0.1, stops)).toBe(0);
  });

  it('returns 1 for t = 0.25', () => {
    expect(findSegmentIndex(0.25, stops)).toBe(1);
  });

  it('returns 2 for t = 0.5', () => {
    expect(findSegmentIndex(0.5, stops)).toBe(2);
  });

  it('returns 3 for t = 0.75', () => {
    expect(findSegmentIndex(0.75, stops)).toBe(3);
  });

  it('returns 3 for t = 1 (last valid segment)', () => {
    // t = 1 is at the boundary; last usable segment is [0.75, 1]
    expect(findSegmentIndex(1, stops)).toBe(3);
  });

  it('returns segment whose start ≤ t', () => {
    expect(findSegmentIndex(0.6, stops)).toBe(2);
    expect(findSegmentIndex(0.3, stops)).toBe(1);
  });
});

// ── lerpPalette ───────────────────────────────────────────────────────────

describe('lerpPalette', () => {
  it('returns the exact first keyframe at t = 0', () => {
    const { top, bottom, accent } = lerpPalette(0);
    const p = PALETTE[0];
    expect(top).toBe(`rgb(${p.top.map(v => Math.round(v * 255)).join(',')})`);
    expect(bottom).toBe(`rgb(${p.bottom.map(v => Math.round(v * 255)).join(',')})`);
    expect(accent).toBe('#' + p.accent.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''));
  });

  it('returns the exact last keyframe at t = 1', () => {
    const { top, bottom, accent } = lerpPalette(1);
    const p = PALETTE[PALETTE.length - 1];
    expect(top).toBe(`rgb(${p.top.map(v => Math.round(v * 255)).join(',')})`);
    expect(bottom).toBe(`rgb(${p.bottom.map(v => Math.round(v * 255)).join(',')})`);
  });

  it('returns strings of the correct shape', () => {
    const { top, bottom, accent } = lerpPalette(0.5);
    expect(top).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
    expect(bottom).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
    expect(accent).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('interpolates midpoint of first segment at t = 0.125', () => {
    const { top } = lerpPalette(0.125);
    const a = PALETTE[0].top;
    const b = PALETTE[1].top;
    const expected = a.map((v, j) => Math.round((v + b[j]) / 2 * 255));
    expect(top).toBe(`rgb(${expected.join(',')})`);
  });

  it('produces different outputs at t = 0.25 vs t = 0.75', () => {
    const r1 = lerpPalette(0.25);
    const r2 = lerpPalette(0.75);
    expect(r1.accent).not.toBe(r2.accent);
  });

  it('accent at t = 0 matches golden palette', () => {
    const { accent } = lerpPalette(0);
    // PALETTE[0].accent = [1.00, 0.843, 0.00] → #ffd700
    expect(accent).toBe('#ffd700');
  });
});

// ── calcSunY ─────────────────────────────────────────────────────────────

describe('calcSunY', () => {
  it('starts at 0.28 (above horizon) when t = 0', () => {
    expect(calcSunY(0)).toBeCloseTo(0.28, 10);
  });

  it('ends at -0.35 (below horizon) when t = 1', () => {
    expect(calcSunY(1)).toBeCloseTo(0.28 - 0.63, 10);
  });

  it('is 0 somewhere between t = 0 and t = 1', () => {
    // 0.28 / 0.63 ≈ 0.444
    const tAtHorizon = 0.28 / 0.63;
    expect(calcSunY(tAtHorizon)).toBeCloseTo(0, 5);
  });

  it('decreases as t increases', () => {
    expect(calcSunY(0.5)).toBeLessThan(calcSunY(0.1));
  });
});

// ── calcSunSize ──────────────────────────────────────────────────────────

describe('calcSunSize', () => {
  it('returns a positive size for all t in [0, 1]', () => {
    for (let t = 0; t <= 1; t += 0.1) {
      expect(calcSunSize(t)).toBeGreaterThan(0);
    }
  });

  it('is largest near t = 0.7 (horizon peak)', () => {
    const sizeAtPeak = calcSunSize(0.7);
    expect(sizeAtPeak).toBeCloseTo(0.36, 3); // 0.22 + 0.14
    expect(sizeAtPeak).toBeGreaterThan(calcSunSize(0));
    expect(sizeAtPeak).toBeGreaterThan(calcSunSize(1));
  });

  it('falls off away from t = 0.7', () => {
    expect(calcSunSize(0.2)).toBeLessThan(calcSunSize(0.7));
    expect(calcSunSize(0.9)).toBeLessThan(calcSunSize(0.7));
  });

  it('minimum size is 0.22 (the base scale)', () => {
    // When |t - 0.7| is large enough that Math.max returns 0
    expect(calcSunSize(0)).toBeGreaterThanOrEqual(0.22);
    expect(calcSunSize(1)).toBeGreaterThanOrEqual(0.22);
  });
});

// ── calcGlowBurst ─────────────────────────────────────────────────────────

describe('calcGlowBurst', () => {
  it('returns 1.0 outside the burst window (t < 0.62)', () => {
    expect(calcGlowBurst(0)).toBe(1.0);
    expect(calcGlowBurst(0.3)).toBe(1.0);
    expect(calcGlowBurst(0.619)).toBe(1.0);
  });

  it('returns 1.0 outside the burst window (t > 0.82)', () => {
    expect(calcGlowBurst(0.82)).toBe(1.0);
    expect(calcGlowBurst(0.9)).toBe(1.0);
    expect(calcGlowBurst(1.0)).toBe(1.0);
  });

  it('returns the peak value > 1 at t = 0.72 (midpoint of burst window)', () => {
    // sin(π) = 0, sin(π/2) = 1 → midpoint should be ≈ 1 + 1.8 = 2.8
    const peak = calcGlowBurst(0.72);
    expect(peak).toBeGreaterThan(1.0);
    expect(peak).toBeCloseTo(2.8, 3);
  });

  it('is symmetric around t = 0.72', () => {
    const left  = calcGlowBurst(0.66);
    const right = calcGlowBurst(0.78);
    expect(left).toBeCloseTo(right, 5);
  });

  it('burst value is > 1 for all t strictly inside (0.62, 0.82)', () => {
    for (let t = 0.63; t < 0.82; t += 0.02) {
      expect(calcGlowBurst(t)).toBeGreaterThan(1.0);
    }
  });
});

// ── calcGlowValue ─────────────────────────────────────────────────────────

describe('calcGlowValue', () => {
  it('equals the burst multiplier before fade-out (t < 0.82)', () => {
    const t = 0.72;
    expect(calcGlowValue(t)).toBeCloseTo(calcGlowBurst(t), 10);
  });

  it('starts fading after t = 0.82', () => {
    expect(calcGlowValue(0.9)).toBeLessThan(calcGlowValue(0.82));
  });

  it('reaches 0 at t = 1', () => {
    expect(calcGlowValue(1)).toBeCloseTo(0, 5);
  });

  it('is non-negative for all t in [0, 1]', () => {
    for (let t = 0; t <= 1; t += 0.05) {
      expect(calcGlowValue(t)).toBeGreaterThanOrEqual(0);
    }
  });

  it('is 1.0 at t = 0 (no burst, no fade)', () => {
    expect(calcGlowValue(0)).toBeCloseTo(1.0, 10);
  });
});

// ── stepCursorRing ────────────────────────────────────────────────────────

describe('stepCursorRing', () => {
  it('advances toward target by the specified factor', () => {
    expect(stepCursorRing(0, 100, 0.11)).toBeCloseTo(11, 10);
  });

  it('stays at target when already there', () => {
    expect(stepCursorRing(50, 50, 0.11)).toBe(50);
  });

  it('converges to target over many steps', () => {
    let pos = 0;
    for (let i = 0; i < 200; i++) pos = stepCursorRing(pos, 100, 0.11);
    expect(pos).toBeGreaterThan(99.9);
  });
});

// ── mouseToNDC ────────────────────────────────────────────────────────────

describe('mouseToNDC', () => {
  it('maps screen centre to (0, 0)', () => {
    const { x, y } = mouseToNDC(960, 540, 1920, 1080);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(0, 10);
  });

  it('maps top-left corner to (-1, +1)', () => {
    const { x, y } = mouseToNDC(0, 0, 1920, 1080);
    expect(x).toBeCloseTo(-1, 10);
    expect(y).toBeCloseTo(1, 10);
  });

  it('maps bottom-right corner to (+1, -1)', () => {
    const { x, y } = mouseToNDC(1920, 1080, 1920, 1080);
    expect(x).toBeCloseTo(1, 10);
    expect(y).toBeCloseTo(-1, 10);
  });
});

// ── PALETTE constant ──────────────────────────────────────────────────────

describe('PALETTE constant', () => {
  it('has exactly 5 keyframes', () => {
    expect(PALETTE).toHaveLength(5);
  });

  it('starts at t = 0 and ends at t = 1', () => {
    expect(PALETTE[0].t).toBe(0);
    expect(PALETTE[PALETTE.length - 1].t).toBe(1);
  });

  it('t values are strictly increasing', () => {
    for (let i = 1; i < PALETTE.length; i++) {
      expect(PALETTE[i].t).toBeGreaterThan(PALETTE[i - 1].t);
    }
  });

  it('all colour channel arrays have exactly 3 elements', () => {
    PALETTE.forEach(({ top, bottom, accent }) => {
      expect(top).toHaveLength(3);
      expect(bottom).toHaveLength(3);
      expect(accent).toHaveLength(3);
    });
  });

  it('all colour channels are in [0, 1]', () => {
    PALETTE.forEach(({ top, bottom, accent }) => {
      [...top, ...bottom, ...accent].forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      });
    });
  });
});
