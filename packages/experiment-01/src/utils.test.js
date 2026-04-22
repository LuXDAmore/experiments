import { describe, it, expect } from 'vitest';
import {
  TYPES, CATEGORIES, SIZES,
  PARTICLE_COUNT, BRANCHES, GALAXY_RADIUS, SPIN, RANDOMNESS_PWR,
  lerp, lenisEasing,
  calcScrollProgress, calcCameraZ,
  getPhotoType, getPhotoCategory, getPhotoSizes, padNumber,
  calcBranchAngle, calcColorLerpFactor,
  stepCursorRing, mouseToNDC,
} from './utils.js';

// ── lerp ─────────────────────────────────────────────────────────────────

describe('lerp', () => {
  it('returns x when f = 0', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(5, 20, 0)).toBe(5);
  });

  it('returns y when f = 1', () => {
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(5, 20, 1)).toBe(20);
  });

  it('returns midpoint when f = 0.5', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(4, 8, 0.5)).toBe(6);
  });

  it('interpolates fractional values correctly', () => {
    expect(lerp(0, 100, 0.25)).toBe(25);
    expect(lerp(0, 100, 0.75)).toBe(75);
  });

  it('works with negative numbers', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
    expect(lerp(-20, -10, 0.5)).toBe(-15);
  });

  it('works when x > y (reverse interpolation)', () => {
    expect(lerp(10, 0, 0.5)).toBe(5);
    expect(lerp(100, 0, 0.25)).toBe(75);
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
    for (const t of [0, 0.1, 0.5, 0.9, 1, 2, 10]) {
      expect(lenisEasing(t)).toBeLessThanOrEqual(1);
    }
  });

  it('is monotonically increasing over [0, 1]', () => {
    const values = [0, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9, 1].map(lenisEasing);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });

  it('is a fast-start, slow-finish curve (value > 0.5 when t = 0.1)', () => {
    expect(lenisEasing(0.1)).toBeGreaterThan(0.5);
  });

  it('approaches 1 quickly (> 0.99 at t = 0.7)', () => {
    expect(lenisEasing(0.7)).toBeGreaterThan(0.99);
  });
});

// ── calcScrollProgress ───────────────────────────────────────────────────

describe('calcScrollProgress', () => {
  it('returns 0 when at the top', () => {
    expect(calcScrollProgress(0, 5000, 900)).toBe(0);
  });

  it('returns 1 when scrolled to the bottom', () => {
    expect(calcScrollProgress(4100, 5000, 900)).toBe(1);
  });

  it('returns 0.5 at the midpoint', () => {
    expect(calcScrollProgress(2050, 5000, 900)).toBe(0.5);
  });

  it('returns a value proportional to scroll position', () => {
    const result = calcScrollProgress(1000, 5000, 1000);
    expect(result).toBeCloseTo(0.25, 5);
  });
});

// ── calcCameraZ ──────────────────────────────────────────────────────────

describe('calcCameraZ', () => {
  it('starts at 7 when scroll is 0', () => {
    expect(calcCameraZ(0)).toBe(7);
  });

  it('ends at 4 when fully scrolled (progress = 1)', () => {
    expect(calcCameraZ(1)).toBe(4);
  });

  it('is at 5.5 at halfway scroll', () => {
    expect(calcCameraZ(0.5)).toBe(5.5);
  });

  it('decreases as scroll progress increases', () => {
    expect(calcCameraZ(0.8)).toBeLessThan(calcCameraZ(0.2));
  });
});

// ── getPhotoType ─────────────────────────────────────────────────────────

describe('getPhotoType', () => {
  it('returns the first type for index 0', () => {
    expect(getPhotoType(0)).toBe('portrait');
  });

  it('cycles correctly through all types', () => {
    TYPES.forEach((type, i) => {
      expect(getPhotoType(i)).toBe(type);
    });
  });

  it('wraps around after TYPES.length items', () => {
    expect(getPhotoType(TYPES.length)).toBe(TYPES[0]);
    expect(getPhotoType(TYPES.length + 3)).toBe(TYPES[3]);
  });

  it('returns only valid type strings', () => {
    const validTypes = new Set(Object.keys(SIZES));
    for (let i = 0; i < 60; i++) {
      expect(validTypes.has(getPhotoType(i))).toBe(true);
    }
  });
});

// ── getPhotoCategory ─────────────────────────────────────────────────────

describe('getPhotoCategory', () => {
  it('returns the first category for index 0', () => {
    expect(getPhotoCategory(0)).toBe('PORTRAIT');
  });

  it('cycles through all CATEGORIES', () => {
    CATEGORIES.forEach((cat, i) => {
      expect(getPhotoCategory(i)).toBe(cat);
    });
  });

  it('wraps around after CATEGORIES.length', () => {
    expect(getPhotoCategory(CATEGORIES.length)).toBe(CATEGORIES[0]);
  });
});

// ── getPhotoSizes ─────────────────────────────────────────────────────────

describe('getPhotoSizes', () => {
  it('returns correct dimensions for portrait', () => {
    expect(getPhotoSizes('portrait')).toEqual({ w: 480, h: 640 });
  });

  it('returns correct dimensions for landscape', () => {
    expect(getPhotoSizes('landscape')).toEqual({ w: 640, h: 426 });
  });

  it('returns correct dimensions for square', () => {
    expect(getPhotoSizes('square')).toEqual({ w: 500, h: 500 });
  });

  it('returns correct dimensions for tall', () => {
    expect(getPhotoSizes('tall')).toEqual({ w: 400, h: 600 });
  });

  it('returns correct dimensions for wide', () => {
    expect(getPhotoSizes('wide')).toEqual({ w: 720, h: 480 });
  });

  it('returns undefined for unknown type', () => {
    expect(getPhotoSizes('unknown')).toBeUndefined();
  });
});

// ── padNumber ─────────────────────────────────────────────────────────────

describe('padNumber', () => {
  it('pads single-digit numbers with a leading zero', () => {
    expect(padNumber(1)).toBe('01');
    expect(padNumber(9)).toBe('09');
  });

  it('does not pad two-digit numbers', () => {
    expect(padNumber(10)).toBe('10');
    expect(padNumber(99)).toBe('99');
  });

  it('returns a string regardless of input type', () => {
    expect(typeof padNumber(5)).toBe('string');
  });
});

// ── calcBranchAngle ───────────────────────────────────────────────────────

describe('calcBranchAngle', () => {
  it('first branch starts at angle 0 for index 0', () => {
    expect(calcBranchAngle(0, BRANCHES)).toBe(0);
  });

  it('splits 3 branches evenly across 2π', () => {
    const step = (Math.PI * 2) / BRANCHES;
    expect(calcBranchAngle(0, BRANCHES)).toBeCloseTo(0 * step, 10);
    expect(calcBranchAngle(1, BRANCHES)).toBeCloseTo(1 * step, 10);
    expect(calcBranchAngle(2, BRANCHES)).toBeCloseTo(2 * step, 10);
  });

  it('cycles back to branch 0 for index equal to branch count', () => {
    expect(calcBranchAngle(BRANCHES, BRANCHES)).toBeCloseTo(0, 10);
  });

  it('produces angles in [0, 2π)', () => {
    for (let i = 0; i < 30; i++) {
      const angle = calcBranchAngle(i, BRANCHES);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(Math.PI * 2);
    }
  });
});

// ── calcColorLerpFactor ───────────────────────────────────────────────────

describe('calcColorLerpFactor', () => {
  it('returns 0 at the centre (r = 0)', () => {
    expect(calcColorLerpFactor(0, GALAXY_RADIUS)).toBe(0);
  });

  it('returns 1 at the outer edge (r = radius)', () => {
    expect(calcColorLerpFactor(GALAXY_RADIUS, GALAXY_RADIUS)).toBe(1);
  });

  it('returns 0.5 at half the radius', () => {
    expect(calcColorLerpFactor(GALAXY_RADIUS / 2, GALAXY_RADIUS)).toBeCloseTo(0.5, 10);
  });

  it('stays in [0, 1] for any valid r ∈ [0, radius]', () => {
    for (let r = 0; r <= GALAXY_RADIUS; r += 0.5) {
      const f = calcColorLerpFactor(r, GALAXY_RADIUS);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });
});

// ── stepCursorRing ────────────────────────────────────────────────────────

describe('stepCursorRing', () => {
  it('moves toward target by the specified factor', () => {
    expect(stepCursorRing(0, 100, 0.14)).toBeCloseTo(14, 10);
  });

  it('returns target when current equals target', () => {
    expect(stepCursorRing(50, 50, 0.14)).toBe(50);
  });

  it('converges toward target over multiple steps', () => {
    let pos = 0;
    for (let i = 0; i < 100; i++) pos = stepCursorRing(pos, 100, 0.14);
    expect(pos).toBeGreaterThan(99.9);
  });

  it('works in the negative direction', () => {
    expect(stepCursorRing(100, 0, 0.14)).toBeCloseTo(86, 10);
  });
});

// ── mouseToNDC ────────────────────────────────────────────────────────────

describe('mouseToNDC', () => {
  it('maps centre to (0, 0)', () => {
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

  it('x is positive for right half of screen', () => {
    const { x } = mouseToNDC(1200, 540, 1920, 1080);
    expect(x).toBeGreaterThan(0);
  });

  it('y is positive for top half of screen', () => {
    const { y } = mouseToNDC(960, 200, 1920, 1080);
    expect(y).toBeGreaterThan(0);
  });
});

// ── Constants sanity checks ───────────────────────────────────────────────

describe('Gallery constants', () => {
  it('TYPES has 10 entries', () => {
    expect(TYPES).toHaveLength(10);
  });

  it('CATEGORIES has 10 entries', () => {
    expect(CATEGORIES).toHaveLength(10);
  });

  it('all TYPES entries are valid SIZES keys', () => {
    TYPES.forEach(type => {
      expect(SIZES[type]).toBeDefined();
    });
  });

  it('all SIZES entries have positive w and h', () => {
    Object.values(SIZES).forEach(({ w, h }) => {
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
    });
  });
});

describe('Galaxy constants', () => {
  it('PARTICLE_COUNT is 6000', () => {
    expect(PARTICLE_COUNT).toBe(6000);
  });

  it('BRANCHES is 3', () => {
    expect(BRANCHES).toBe(3);
  });

  it('GALAXY_RADIUS is positive', () => {
    expect(GALAXY_RADIUS).toBeGreaterThan(0);
  });

  it('SPIN is a positive number', () => {
    expect(SPIN).toBeGreaterThan(0);
  });

  it('RANDOMNESS_PWR is a positive integer', () => {
    expect(RANDOMNESS_PWR).toBeGreaterThan(0);
    expect(Number.isInteger(RANDOMNESS_PWR)).toBe(true);
  });
});
