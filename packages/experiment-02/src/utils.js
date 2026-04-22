/**
 * Pure utility functions extracted from the VORTEX experiment.
 * These are framework-free and can be unit-tested without a browser.
 */

// ── Neon colour palette ───────────────────────────────────────────────────

export const NEON_COLORS = [
  0x4361EE, // blue
  0x7209B7, // purple
  0x4CC9F0, // cyan
  0xF72585, // magenta
  0xFFE600, // yellow
  0x39FF14, // neon green
];

// ── Math helpers ─────────────────────────────────────────────────────────

/** Lenis smooth-scroll exponential easing (always returns 0–1). */
export function lenisEasing(t) {
  return Math.min(1, 1.001 - Math.pow(2, -10 * t));
}

/** Returns true if the value is one of the allowed neon colours. */
export function isNeonColor(value) {
  return NEON_COLORS.includes(value);
}

// ── Scroll helpers ────────────────────────────────────────────────────────

/**
 * Clamp a scroll progress value to the safe range for CatmullRomCurve3.getPoint().
 * THREE's getPoint(1) can misbehave, so we stay just below 1.
 */
export function clampScrollT(t) {
  return Math.min(t, 0.9999);
}

/**
 * Bloom post-processing strength driven by scroll progress.
 * Starts at 0.8 and rises to 2.0 by the end of the scroll.
 * @param {number} scrollT  0–1.
 */
export function calcBloomStrength(scrollT) {
  return 0.8 + scrollT * 1.2;
}

/**
 * Scroll percentage for the progress-bar element.
 * @param {number} scrollY  Current window.scrollY.
 * @param {number} bodyScrollHeight  document.body.scrollHeight.
 * @param {number} innerHeight  window.innerHeight.
 */
export function calcScrollPct(scrollY, bodyScrollHeight, innerHeight) {
  return scrollY / (bodyScrollHeight - innerHeight) * 100;
}

// ── Light animation ───────────────────────────────────────────────────────

/**
 * Point-light 1 position (blue light).
 * @param {number} elapsed  Elapsed seconds.
 * @param {number} camZ  Current camera Z.
 */
export function calcLightPosition1(elapsed, camZ) {
  return {
    x: Math.sin(elapsed * 0.5) * 8,
    y: Math.cos(elapsed * 0.3) * 6,
    z: camZ + 5,
  };
}

/**
 * Point-light 2 position (magenta light).
 * @param {number} elapsed  Elapsed seconds.
 * @param {number} camZ  Current camera Z.
 */
export function calcLightPosition2(elapsed, camZ) {
  return {
    x: Math.cos(elapsed * 0.4) * 8,
    y: Math.sin(elapsed * 0.6) * 6,
    z: camZ - 5,
  };
}

// ── Camera helpers ────────────────────────────────────────────────────────

/**
 * Advance scroll position by a small lookahead for camera-target calculation.
 * @param {number} t  Current scroll progress (0–1, already clamped).
 * @param {number} lookahead  How far ahead to look (default 0.012).
 */
export function calcLookaheadT(t, lookahead = 0.012) {
  return Math.min(t + lookahead, 0.9999);
}

// ── Cursor & mouse ────────────────────────────────────────────────────────

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

/**
 * One smooth-follow step for the cursor ring.
 * @param {number} current  Current position.
 * @param {number} target   Target position (mouse).
 * @param {number} factor   Interpolation factor (e.g. 0.12).
 */
export function stepCursorRing(current, target, factor) {
  return current + (target - current) * factor;
}
