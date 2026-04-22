import { describe, it, expect } from 'vitest';
import {
  NEON_COLORS,
  lenisEasing, isNeonColor,
  clampScrollT, calcBloomStrength, calcScrollPct,
  calcLightPosition1, calcLightPosition2,
  calcLookaheadT,
  mouseToNDC, stepCursorRing,
} from './utils.js';

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
    for (const t of [0, 0.25, 0.5, 0.75, 1, 1.5, 5]) {
      expect(lenisEasing(t)).toBeLessThanOrEqual(1);
    }
  });

  it('is monotonically non-decreasing over [0, 1]', () => {
    const steps = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const values = steps.map(lenisEasing);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });

  it('rises steeply early: value > 0.5 at t = 0.1', () => {
    expect(lenisEasing(0.1)).toBeGreaterThan(0.5);
  });
});

// ── NEON_COLORS / isNeonColor ─────────────────────────────────────────────

describe('NEON_COLORS', () => {
  it('contains exactly 6 colours', () => {
    expect(NEON_COLORS).toHaveLength(6);
  });

  it('all entries are positive integers', () => {
    NEON_COLORS.forEach(c => {
      expect(Number.isInteger(c)).toBe(true);
      expect(c).toBeGreaterThan(0);
    });
  });

  it('all entries fit in 24-bit colour range (≤ 0xFFFFFF)', () => {
    NEON_COLORS.forEach(c => {
      expect(c).toBeLessThanOrEqual(0xFFFFFF);
    });
  });

  it('contains blue (0x4361EE)', () => {
    expect(NEON_COLORS).toContain(0x4361EE);
  });

  it('contains neon green (0x39FF14)', () => {
    expect(NEON_COLORS).toContain(0x39FF14);
  });
});

describe('isNeonColor', () => {
  it('returns true for every known neon colour', () => {
    NEON_COLORS.forEach(c => {
      expect(isNeonColor(c)).toBe(true);
    });
  });

  it('returns false for an unknown colour', () => {
    expect(isNeonColor(0x123456)).toBe(false);
    expect(isNeonColor(0x000000)).toBe(false);
  });
});

// ── clampScrollT ─────────────────────────────────────────────────────────

describe('clampScrollT', () => {
  it('returns 0 for t = 0', () => {
    expect(clampScrollT(0)).toBe(0);
  });

  it('clamps t = 1 to 0.9999', () => {
    expect(clampScrollT(1)).toBe(0.9999);
  });

  it('passes through values below 0.9999 unchanged', () => {
    expect(clampScrollT(0.5)).toBe(0.5);
    expect(clampScrollT(0.9998)).toBe(0.9998);
  });

  it('clamps values above 0.9999 to 0.9999', () => {
    expect(clampScrollT(1.5)).toBe(0.9999);
  });
});

// ── calcBloomStrength ─────────────────────────────────────────────────────

describe('calcBloomStrength', () => {
  it('starts at 0.8 when scrollT = 0', () => {
    expect(calcBloomStrength(0)).toBeCloseTo(0.8, 5);
  });

  it('reaches 2.0 when scrollT = 1', () => {
    expect(calcBloomStrength(1)).toBeCloseTo(2.0, 5);
  });

  it('is 1.4 at scrollT = 0.5 (midpoint)', () => {
    expect(calcBloomStrength(0.5)).toBeCloseTo(1.4, 5);
  });

  it('increases as scrollT increases', () => {
    expect(calcBloomStrength(0.8)).toBeGreaterThan(calcBloomStrength(0.2));
  });
});

// ── calcScrollPct ─────────────────────────────────────────────────────────

describe('calcScrollPct', () => {
  it('returns 0% at the top', () => {
    expect(calcScrollPct(0, 5000, 900)).toBe(0);
  });

  it('returns 100% when fully scrolled to the bottom', () => {
    expect(calcScrollPct(4100, 5000, 900)).toBe(100);
  });

  it('returns 50% at the midpoint', () => {
    expect(calcScrollPct(2050, 5000, 900)).toBeCloseTo(50, 5);
  });

  it('returns values proportional to position', () => {
    const total = 5000 - 1000;
    expect(calcScrollPct(1000, 5000, 1000)).toBeCloseTo(25, 5);
  });
});

// ── calcLightPosition1 ────────────────────────────────────────────────────

describe('calcLightPosition1', () => {
  it('returns the correct z offset from camZ', () => {
    const { z } = calcLightPosition1(0, -20);
    expect(z).toBe(-15);
  });

  it('x oscillates between -8 and 8', () => {
    const xs = [0, 1, 2, 3, 4, 5, 6].map(t => calcLightPosition1(t, 0).x);
    xs.forEach(x => {
      expect(x).toBeGreaterThanOrEqual(-8);
      expect(x).toBeLessThanOrEqual(8);
    });
  });

  it('y oscillates between -6 and 6', () => {
    const ys = [0, 1, 2, 3, 4, 5, 6].map(t => calcLightPosition1(t, 0).y);
    ys.forEach(y => {
      expect(y).toBeGreaterThanOrEqual(-6);
      expect(y).toBeLessThanOrEqual(6);
    });
  });

  it('returns a different position at elapsed = 1 vs elapsed = 0', () => {
    const p0 = calcLightPosition1(0, 0);
    const p1 = calcLightPosition1(1, 0);
    expect(p0.x).not.toBeCloseTo(p1.x, 3);
  });
});

// ── calcLightPosition2 ────────────────────────────────────────────────────

describe('calcLightPosition2', () => {
  it('returns the correct z offset from camZ', () => {
    const { z } = calcLightPosition2(0, -20);
    expect(z).toBe(-25);
  });

  it('x oscillates between -8 and 8', () => {
    const xs = [0, 1, 2, 3, 4, 5, 6].map(t => calcLightPosition2(t, 0).x);
    xs.forEach(x => {
      expect(x).toBeGreaterThanOrEqual(-8);
      expect(x).toBeLessThanOrEqual(8);
    });
  });

  it('y oscillates between -6 and 6', () => {
    const ys = [0, 1, 2, 3, 4, 5, 6].map(t => calcLightPosition2(t, 0).y);
    ys.forEach(y => {
      expect(y).toBeGreaterThanOrEqual(-6);
      expect(y).toBeLessThanOrEqual(6);
    });
  });
});

// ── calcLookaheadT ────────────────────────────────────────────────────────

describe('calcLookaheadT', () => {
  it('advances scroll position by the default lookahead (0.012)', () => {
    expect(calcLookaheadT(0.5)).toBeCloseTo(0.512, 5);
  });

  it('accepts a custom lookahead value', () => {
    expect(calcLookaheadT(0.5, 0.05)).toBeCloseTo(0.55, 5);
  });

  it('never exceeds 0.9999', () => {
    expect(calcLookaheadT(0.999)).toBe(0.9999);
    expect(calcLookaheadT(1.0)).toBe(0.9999);
  });

  it('returns lookahead even when base t = 0', () => {
    expect(calcLookaheadT(0)).toBeCloseTo(0.012, 5);
  });
});

// ── mouseToNDC ────────────────────────────────────────────────────────────

describe('mouseToNDC', () => {
  it('maps the centre to (0, 0)', () => {
    const { x, y } = mouseToNDC(960, 540, 1920, 1080);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(0, 10);
  });

  it('maps top-left to (-1, +1)', () => {
    const { x, y } = mouseToNDC(0, 0, 1920, 1080);
    expect(x).toBeCloseTo(-1, 10);
    expect(y).toBeCloseTo(1, 10);
  });

  it('maps bottom-right to (+1, -1)', () => {
    const { x, y } = mouseToNDC(1920, 1080, 1920, 1080);
    expect(x).toBeCloseTo(1, 10);
    expect(y).toBeCloseTo(-1, 10);
  });

  it('x is positive for the right half, negative for the left', () => {
    expect(mouseToNDC(1500, 540, 1920, 1080).x).toBeGreaterThan(0);
    expect(mouseToNDC(200,  540, 1920, 1080).x).toBeLessThan(0);
  });

  it('y is positive for the top half, negative for the bottom', () => {
    expect(mouseToNDC(960, 100,  1920, 1080).y).toBeGreaterThan(0);
    expect(mouseToNDC(960, 1000, 1920, 1080).y).toBeLessThan(0);
  });
});

// ── stepCursorRing ────────────────────────────────────────────────────────

describe('stepCursorRing', () => {
  it('moves toward target by the given factor', () => {
    expect(stepCursorRing(0, 100, 0.12)).toBeCloseTo(12, 10);
  });

  it('stays at target when already there', () => {
    expect(stepCursorRing(50, 50, 0.12)).toBe(50);
  });

  it('converges to target over many steps', () => {
    let pos = 0;
    for (let i = 0; i < 200; i++) pos = stepCursorRing(pos, 100, 0.12);
    expect(pos).toBeGreaterThan(99.9);
  });

  it('works in the negative direction', () => {
    expect(stepCursorRing(100, 0, 0.12)).toBeCloseTo(88, 10);
  });
});
