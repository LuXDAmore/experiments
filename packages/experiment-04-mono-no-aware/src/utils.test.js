import { describe, it, expect } from 'vitest';
import {
  PALETTE, BG_T, PETAL_COUNT, SPREAD_Y,
  lerp, lenisEasing, toHex,
  lerpPalette,
  findBgSegment,
  calcPetalSway, calcRepelForce, stepPetalPosition, isPetalBelowScreen, calcPetalDensity,
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
    [0, 0.5, 1, 2].forEach(t => {
      expect(lenisEasing(t)).toBeLessThanOrEqual(1);
    });
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

  it('returns exactly 7 characters (# + 6 hex digits)', () => {
    expect(toHex([0.5, 0.25, 0.75])).toHaveLength(7);
  });

  it('output matches the hex pattern #[0-9a-f]{6}', () => {
    expect(toHex([0.3, 0.6, 0.9])).toMatch(/^#[0-9a-f]{6}$/);
  });
});

// ── lerpPalette ───────────────────────────────────────────────────────────

describe('lerpPalette', () => {
  it('returns strings of the correct shape at every keyframe', () => {
    PALETTE.forEach(({ t }) => {
      if (t === 1) return; // last keyframe uses the same segment [3] → safe
      const { accent, text } = lerpPalette(t);
      expect(accent).toMatch(/^#[0-9a-f]{6}$/);
      expect(text).toMatch(/^rgba\(\d+,\d+,\d+, \.75\)$/);
    });
  });

  it('returns exact first keyframe at t = 0', () => {
    const { accent } = lerpPalette(0);
    const p = PALETTE[0];
    expect(accent).toBe('#' + p.accent.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''));
  });

  it('produces different accents at different scroll positions', () => {
    expect(lerpPalette(0).accent).not.toBe(lerpPalette(0.5).accent);
    expect(lerpPalette(0.2).accent).not.toBe(lerpPalette(0.75).accent);
  });

  it('text contains ", .75)" suffix for transparency', () => {
    expect(lerpPalette(0.3).text).toContain(', .75)');
  });

  it('interpolates midpoint of segment [0, 0.2] at t = 0.1', () => {
    const { accent } = lerpPalette(0.1);
    const a = PALETTE[0].accent;
    const b = PALETTE[1].accent;
    const expected = '#' + a.map((v, j) => Math.round(((v + b[j]) / 2) * 255).toString(16).padStart(2, '0')).join('');
    expect(accent).toBe(expected);
  });
});

// ── findBgSegment ─────────────────────────────────────────────────────────

describe('findBgSegment', () => {
  it('returns i = 0 and segT = 0 for t = 0', () => {
    const { i, segT } = findBgSegment(0);
    expect(i).toBe(0);
    expect(segT).toBe(0);
  });

  it('returns i = 0 and segT = 0.5 for t = 0.1 (halfway into [0, 0.2])', () => {
    const { i, segT } = findBgSegment(0.1);
    expect(i).toBe(0);
    expect(segT).toBeCloseTo(0.5, 5);
  });

  it('returns i = 1 for t = 0.2', () => {
    const { i } = findBgSegment(0.2);
    expect(i).toBe(1);
  });

  it('returns i = 2 for t = 0.5', () => {
    const { i } = findBgSegment(0.5);
    expect(i).toBe(2);
  });

  it('returns i = 3 for t = 0.75', () => {
    const { i } = findBgSegment(0.75);
    expect(i).toBe(3);
  });

  it('segT is in [0, 1] for all valid t', () => {
    [0, 0.1, 0.2, 0.35, 0.5, 0.6, 0.75, 0.9, 1].forEach(t => {
      const { segT } = findBgSegment(t);
      expect(segT).toBeGreaterThanOrEqual(0);
      expect(segT).toBeLessThanOrEqual(1);
    });
  });
});

// ── calcPetalSway ─────────────────────────────────────────────────────────

describe('calcPetalSway', () => {
  it('returns a value between -0.006 and +0.006', () => {
    for (let e = 0; e < 30; e++) {
      const sway = calcPetalSway(e, 0);
      expect(sway).toBeGreaterThanOrEqual(-0.006);
      expect(sway).toBeLessThanOrEqual(0.006);
    }
  });

  it('is bounded regardless of phase', () => {
    const phases = [0, Math.PI / 4, Math.PI / 2, Math.PI, 2 * Math.PI];
    phases.forEach(phase => {
      const sway = calcPetalSway(10, phase);
      expect(Math.abs(sway)).toBeLessThanOrEqual(0.006);
    });
  });

  it('is 0 when sin argument is 0 (elapsed = 0, phase = 0)', () => {
    expect(calcPetalSway(0, 0)).toBeCloseTo(0, 10);
  });

  it('returns +0.006 at the sine peak (elapsed * 0.7 + phase = π/2)', () => {
    const elapsed = Math.PI / 2 / 0.7;
    expect(calcPetalSway(elapsed, 0)).toBeCloseTo(0.006, 5);
  });

  it('varies with different phases at the same elapsed time', () => {
    const s1 = calcPetalSway(5, 0);
    const s2 = calcPetalSway(5, Math.PI);
    expect(s1).not.toBeCloseTo(s2, 5);
  });
});

// ── calcRepelForce ────────────────────────────────────────────────────────

describe('calcRepelForce', () => {
  it('returns 0 when outside the repulsion radius (dist² ≥ 0.8)', () => {
    // dx = 1, dy = 0 → dist² = 1 ≥ 0.8
    expect(calcRepelForce(1, 0)).toBe(0);
    expect(calcRepelForce(2, 2)).toBe(0);
  });

  it('returns a positive force inside the radius', () => {
    // dx = 0.5, dy = 0.5 → dist² = 0.5 < 0.8
    expect(calcRepelForce(0.5, 0.5)).toBeGreaterThan(0);
  });

  it('returns maximum force at the origin (dist² = 0)', () => {
    expect(calcRepelForce(0, 0)).toBeCloseTo(0.8 * 0.012, 10);
  });

  it('force is 0 at exactly dist² = 0.8', () => {
    const dx = Math.sqrt(0.8);
    expect(calcRepelForce(dx, 0)).toBeCloseTo(0, 10);
  });

  it('force decreases as distance increases (within radius)', () => {
    const f1 = calcRepelForce(0.1, 0.1);
    const f2 = calcRepelForce(0.5, 0.5);
    expect(f1).toBeGreaterThan(f2);
  });

  it('force is symmetric: (dx, dy) and (-dx, -dy) give the same result', () => {
    expect(calcRepelForce(0.3, 0.4)).toBeCloseTo(calcRepelForce(-0.3, -0.4), 10);
  });
});

// ── stepPetalPosition ─────────────────────────────────────────────────────

describe('stepPetalPosition', () => {
  it('advances position by velocity when there is no sway or repulsion', () => {
    const { x, y } = stepPetalPosition(0, 0, 0.002, -0.01, 0, 0, 0, 0);
    expect(x).toBeCloseTo(0.002, 10);
    expect(y).toBeCloseTo(-0.01, 10);
  });

  it('adds sway to x', () => {
    const { x } = stepPetalPosition(0, 0, 0, 0, 0.005, 0, 0, 0);
    expect(x).toBeCloseTo(0.005, 10);
  });

  it('applies repulsion force along dx', () => {
    // repelForce = 0.1, dx = 1 → contribution = 0.1
    const { x } = stepPetalPosition(0, 0, 0, 0, 0, 0.1, 1, 0);
    expect(x).toBeCloseTo(0.1, 10);
  });

  it('applies half repulsion force along dy for y axis', () => {
    // repelForce = 0.1, dy = 1 → y contribution = 0.1 * 0.5 = 0.05
    const { y } = stepPetalPosition(0, 0, 0, 0, 0, 0.1, 0, 1);
    expect(y).toBeCloseTo(0.05, 10);
  });

  it('combining all forces gives the expected result', () => {
    const px = 1, py = 2;
    const velX = 0.002, velY = -0.01;
    const sway = 0.003;
    const force = 0.05;
    const dx = 0.6, dy = 0.4;
    const { x, y } = stepPetalPosition(px, py, velX, velY, sway, force, dx, dy);
    expect(x).toBeCloseTo(px + velX + sway + dx * force, 10);
    expect(y).toBeCloseTo(py + velY + dy * force * 0.5, 10);
  });
});

// ── isPetalBelowScreen ────────────────────────────────────────────────────

describe('isPetalBelowScreen', () => {
  it('returns true when py < -SPREAD_Y', () => {
    expect(isPetalBelowScreen(-SPREAD_Y - 0.1)).toBe(true);
    expect(isPetalBelowScreen(-100)).toBe(true);
  });

  it('returns false when py === -SPREAD_Y', () => {
    expect(isPetalBelowScreen(-SPREAD_Y)).toBe(false);
  });

  it('returns false when py > -SPREAD_Y', () => {
    expect(isPetalBelowScreen(0)).toBe(false);
    expect(isPetalBelowScreen(-SPREAD_Y + 0.1)).toBe(false);
  });
});

// ── calcPetalDensity ──────────────────────────────────────────────────────

describe('calcPetalDensity', () => {
  it('returns 0.15 at scrollT = 0 (sparse start)', () => {
    expect(calcPetalDensity(0)).toBeCloseTo(0.15, 5);
  });

  it('returns 0.15 at scrollT = 1 (sparse end)', () => {
    expect(calcPetalDensity(1)).toBeCloseTo(0.15, 5);
  });

  it('peaks at scrollT = 0.5 (dense middle)', () => {
    expect(calcPetalDensity(0.5)).toBeCloseTo(1.0, 5);
  });

  it('is always between 0.15 and 1.0', () => {
    for (let t = 0; t <= 1; t += 0.05) {
      const d = calcPetalDensity(t);
      expect(d).toBeGreaterThanOrEqual(0.15);
      expect(d).toBeLessThanOrEqual(1.0);
    }
  });

  it('is symmetric around t = 0.5', () => {
    expect(calcPetalDensity(0.25)).toBeCloseTo(calcPetalDensity(0.75), 5);
    expect(calcPetalDensity(0.1)).toBeCloseTo(calcPetalDensity(0.9), 5);
  });
});

// ── stepCursorRing ────────────────────────────────────────────────────────

describe('stepCursorRing', () => {
  it('advances toward target by the given factor', () => {
    expect(stepCursorRing(0, 100, 0.11)).toBeCloseTo(11, 10);
  });

  it('stays at target when already there', () => {
    expect(stepCursorRing(80, 80, 0.11)).toBe(80);
  });

  it('converges to target over many iterations', () => {
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
});

// ── Constants sanity checks ───────────────────────────────────────────────

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
    PALETTE.forEach(({ accent, text }) => {
      expect(accent).toHaveLength(3);
      expect(text).toHaveLength(3);
    });
  });

  it('all colour channels are in [0, 1]', () => {
    PALETTE.forEach(({ accent, text }) => {
      [...accent, ...text].forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      });
    });
  });
});

describe('BG_T constant', () => {
  it('has 5 entries matching PALETTE length', () => {
    expect(BG_T).toHaveLength(PALETTE.length);
  });

  it('starts at 0 and ends at 1', () => {
    expect(BG_T[0]).toBe(0);
    expect(BG_T[BG_T.length - 1]).toBe(1);
  });

  it('is strictly increasing', () => {
    for (let i = 1; i < BG_T.length; i++) {
      expect(BG_T[i]).toBeGreaterThan(BG_T[i - 1]);
    }
  });
});

describe('PETAL_COUNT and SPREAD_Y', () => {
  it('PETAL_COUNT is 350', () => {
    expect(PETAL_COUNT).toBe(350);
  });

  it('SPREAD_Y is 6', () => {
    expect(SPREAD_Y).toBe(6);
  });
});
