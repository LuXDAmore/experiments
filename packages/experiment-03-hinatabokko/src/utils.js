/**
 * Pure utility functions extracted from the HINATABOKKO experiment.
 * These are framework-free and can be unit-tested without a browser.
 */

// ── Sky colour palette ────────────────────────────────────────────────────

/**
 * Five-keyframe palette that drives the sky gradient and accent colour.
 * Each channel is a float in [0, 1].
 * top/bottom define the CSS gradient stops; accent is the UI highlight colour.
 */
export const PALETTE = [
  { t: 0,    top: [1.00, 0.843, 0.00],  bottom: [1.00, 0.549, 0.00], accent: [1.00, 0.843, 0.00] }, // gold
  { t: 0.25, top: [1.00, 0.420, 0.00],  bottom: [1.00, 0.271, 0.00], accent: [1.00, 0.420, 0.00] }, // deep orange
  { t: 0.5,  top: [0.87, 0.133, 0.00],  bottom: [0.753, 0.224, 0.169], accent: [1.00, 0.133, 0.00] }, // red
  { t: 0.75, top: [0.545, 0.00, 0.00],  bottom: [0.294, 0.00, 0.510], accent: [0.8, 0.2, 0.5] },    // violet dusk
  { t: 1,    top: [0.102, 0.039, 0.086], bottom: [0.051, 0.00, 0.082], accent: [0.6, 0.3, 0.8] },   // night
];

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
 * Convert a float [0–1] RGB array to a CSS `rgb(...)` string.
 * @param {number[]} arr  Three-element array of floats [r, g, b].
 */
export function toRgb(arr) {
  return `rgb(${arr.map(v => Math.round(v * 255)).join(',')})`;
}

/**
 * Convert a float [0–1] RGB array to a CSS hex colour string.
 * @param {number[]} arr  Three-element array of floats [r, g, b].
 */
export function toHex(arr) {
  return '#' + arr.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

// ── Palette segment helpers ───────────────────────────────────────────────

/**
 * Find the lower palette segment index for a given t.
 * Scans from the end so it returns the last segment whose start ≤ t.
 * @param {number} t  Scroll progress [0–1].
 * @param {number[]} stops  Sorted array of segment start values.
 */
export function findSegmentIndex(t, stops) {
  let i = 0;
  for (let k = stops.length - 2; k >= 0; k--) {
    if (t >= stops[k]) { i = k; break; }
  }
  return i;
}

/**
 * Interpolate the PALETTE at scroll position t (0–1).
 * @returns {{ top: string, bottom: string, accent: string }}
 */
export function lerpPalette(t) {
  const stops = PALETTE.map(p => p.t);
  const i = findSegmentIndex(t, stops);
  const a = PALETTE[i];
  const b = PALETTE[i + 1];
  const f = (t - a.t) / (b.t - a.t);

  return {
    top:    toRgb(a.top.map((v, j)    => lerp(v, b.top[j],    f))),
    bottom: toRgb(a.bottom.map((v, j) => lerp(v, b.bottom[j], f))),
    accent: toHex(a.accent.map((v, j) => lerp(v, b.accent[j], f))),
  };
}

// ── Sun animation ─────────────────────────────────────────────────────────

/**
 * Sun vertical position in world-space Y.
 * Descends from 0.28 (above horizon) to −0.35 (below) over the full scroll.
 * @param {number} t  Scroll progress [0–1].
 */
export function calcSunY(t) {
  return 0.28 - t * 0.63;
}

/**
 * Sun visual scale – peaks near the horizon (t ≈ 0.7).
 * @param {number} t  Scroll progress [0–1].
 */
export function calcSunSize(t) {
  return 0.22 + Math.max(0, 0.14 - Math.abs(t - 0.7) * 0.7);
}

/**
 * Glow-burst multiplier that activates just before the sun sets (0.62 < t < 0.82).
 * @param {number} t  Scroll progress [0–1].
 */
export function calcGlowBurst(t) {
  return t > 0.62 && t < 0.82
    ? 1.0 + Math.sin((t - 0.62) / 0.2 * Math.PI) * 1.8
    : 1.0;
}

/**
 * Combined glow value – burst × linear fade-out after t = 0.82.
 * @param {number} t  Scroll progress [0–1].
 */
export function calcGlowValue(t) {
  return calcGlowBurst(t) * (1 - Math.max(0, (t - 0.82) / 0.18));
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
