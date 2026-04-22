/**
 * Pure utility functions extracted from the MONO NO AWARE experiment.
 * These are framework-free and can be unit-tested without a browser.
 */

// ── Colour palette ────────────────────────────────────────────────────────

/**
 * Five-keyframe palette driving the accent colour and text colour over scroll.
 * Each channel is a float in [0, 1].
 */
export const PALETTE = [
  { t: 0,    accent: [1.00, 0.718, 0.773], text: [0.8,  0.7,  0.85] },  // blush on dark
  { t: 0.2,  accent: [1.00, 0.855, 0.867], text: [0.25, 0.10, 0.35] },  // petal — dark text
  { t: 0.5,  accent: [0.957, 0.627, 0.690], text: [0.2, 0.06, 0.28] },  // rose — dark text
  { t: 0.75, accent: [0.769, 0.463, 0.533], text: [0.9, 0.85, 0.9] },   // lilac — light text
  { t: 1,    accent: [0.7,   0.5,   0.7],   text: [0.9, 0.9,  0.95] },  // night — light text
];

/** Normalised scroll positions for the background gradient segments. */
export const BG_T = [0, 0.2, 0.5, 0.75, 1.0];

// ── Petal physics constants ───────────────────────────────────────────────

/** Total number of falling-petal particles. */
export const PETAL_COUNT = 350;

/** Half-extent of the particle spawn area in world units. */
export const SPREAD_Y = 6;

// ── Math helpers ─────────────────────────────────────────────────────────

/** Linear interpolation between x and y by factor f. */
export function lerp(x, y, f) {
  return x + (y - x) * f;
}

/** Lenis smooth-scroll exponential easing (always returns 0–1). */
export function lenisEasing(t) {
  return Math.min(1, 1.001 - Math.pow(2, -10 * t));
}

// ── Colour helpers ────────────────────────────────────────────────────────

/**
 * Convert a float [0–1] RGB array to a CSS hex colour string.
 * @param {number[]} arr  Three-element array [r, g, b].
 */
export function toHex(arr) {
  return '#' + arr.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

// ── Palette interpolation ─────────────────────────────────────────────────

/**
 * Interpolate the PALETTE at scroll position t (0–1).
 * @returns {{ accent: string, text: string }}
 */
export function lerpPalette(t) {
  let i = 0;
  for (let k = PALETTE.length - 2; k >= 0; k--) {
    if (t >= PALETTE[k].t) { i = k; break; }
  }
  const a = PALETTE[i];
  const b = PALETTE[i + 1];
  const f = (t - a.t) / (b.t - a.t);
  const lerpV = (x, y) => x + (y - x) * f;

  return {
    accent: toHex(a.accent.map((v, j) => lerpV(v, b.accent[j]))),
    text: `rgba(${a.text.map((v, j) => Math.round(lerpV(v, b.text[j]) * 255)).join(',')}, .75)`,
  };
}

// ── Background gradient segment ───────────────────────────────────────────

/**
 * Find the background-gradient segment and local interpolation factor for t.
 * @param {number} t  Scroll progress [0–1].
 * @returns {{ i: number, segT: number }}
 */
export function findBgSegment(t) {
  let i = 0;
  for (let k = BG_T.length - 2; k >= 0; k--) {
    if (t >= BG_T[k]) { i = k; break; }
  }
  const segT = (t - BG_T[i]) / (BG_T[i + 1] - BG_T[i]);
  return { i, segT };
}

// ── Petal physics ─────────────────────────────────────────────────────────

/**
 * Sinusoidal horizontal sway for a petal at the given elapsed time and phase.
 * @param {number} elapsed  Elapsed seconds.
 * @param {number} phase    Per-petal random phase offset [0, 2π).
 */
export function calcPetalSway(elapsed, phase) {
  return Math.sin(elapsed * 0.7 + phase) * 0.006;
}

/**
 * Mouse-repulsion force magnitude for a petal at (dx, dy) from the repel point.
 * Returns a non-negative force; 0 outside the 0.8-unit radius.
 * @param {number} dx  X distance from repel point.
 * @param {number} dy  Y distance from repel point.
 */
export function calcRepelForce(dx, dy) {
  const dist2 = dx * dx + dy * dy;
  return dist2 < 0.8 ? (0.8 - dist2) * 0.012 : 0;
}

/**
 * Apply one physics step to a petal, returning its new (x, y) position.
 * @param {number} px  Current X position.
 * @param {number} py  Current Y position.
 * @param {number} velX  X velocity (horizontal drift).
 * @param {number} velY  Y velocity (downward fall, negative).
 * @param {number} sway  Computed sway value from calcPetalSway.
 * @param {number} repelForce  Computed repulsion magnitude from calcRepelForce.
 * @param {number} dx  X distance from repel point.
 * @param {number} dy  Y distance from repel point.
 */
export function stepPetalPosition(px, py, velX, velY, sway, repelForce, dx, dy) {
  return {
    x: px + velX + sway + dx * repelForce,
    y: py + velY + dy * repelForce * 0.5,
  };
}

/**
 * Whether a petal has fallen below the visible screen area.
 * @param {number} py  Current Y position.
 */
export function isPetalBelowScreen(py) {
  return py < -SPREAD_Y;
}

/**
 * Petal density for a given scroll position.
 * Follows a sine arc: sparse at 0, peaks at t = 0.5, sparse again at 1.
 * @param {number} scrollT  Scroll progress [0–1].
 */
export function calcPetalDensity(scrollT) {
  return Math.sin(scrollT * Math.PI) * 0.85 + 0.15;
}

// ── Cursor & mouse ────────────────────────────────────────────────────────

/**
 * One smooth-follow step for the cursor ring.
 * @param {number} current  Current position.
 * @param {number} target   Target position.
 * @param {number} factor   Interpolation factor (0.11 in the original).
 */
export function stepCursorRing(current, target, factor) {
  return current + (target - current) * factor;
}

/**
 * Convert client mouse coordinates to normalised device coordinates (NDC).
 * NDC x: -1 (left) → +1 (right); y: -1 (bottom) → +1 (top).
 */
export function mouseToNDC(clientX, clientY, width, height) {
  return {
    x:  (clientX / width  - 0.5) * 2,
    y: -(clientY / height - 0.5) * 2,
  };
}
