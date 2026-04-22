/**
 * Pure utility functions extracted from the CHROMATIC experiment.
 * These are framework-free and can be unit-tested without a browser.
 */

// ── Gallery configuration ─────────────────────────────────────────────────

export const TYPES = [
  'portrait', 'landscape', 'square', 'tall', 'wide',
  'portrait', 'landscape', 'square', 'tall', 'square',
];

export const CATEGORIES = [
  'PORTRAIT', 'LANDSCAPE', 'STREET', 'ABSTRACT', 'NATURE',
  'URBAN', 'MACRO', 'ARCHITECTURE', 'TRAVEL', 'TEXTURE',
];

export const SIZES = {
  portrait:  { w: 480, h: 640 },
  landscape: { w: 640, h: 426 },
  square:    { w: 500, h: 500 },
  tall:      { w: 400, h: 600 },
  wide:      { w: 720, h: 480 },
};

// ── Galaxy particle constants ─────────────────────────────────────────────

export const PARTICLE_COUNT  = 6000;
export const BRANCHES        = 3;
export const GALAXY_RADIUS   = 5;
export const SPIN            = 1.2;
export const RANDOMNESS_PWR  = 3;

// ── Math helpers ─────────────────────────────────────────────────────────

/** Linear interpolation between x and y by factor f. */
export function lerp(x, y, f) {
  return x + (y - x) * f;
}

/** Lenis smooth-scroll exponential easing (always returns 0–1). */
export function lenisEasing(t) {
  return Math.min(1, 1.001 - Math.pow(2, -10 * t));
}

// ── Scroll / camera ───────────────────────────────────────────────────────

/**
 * Compute normalised scroll progress (0–1).
 * @param {number} scrollY  Current window.scrollY.
 * @param {number} bodyScrollHeight  document.body.scrollHeight.
 * @param {number} innerHeight  window.innerHeight.
 */
export function calcScrollProgress(scrollY, bodyScrollHeight, innerHeight) {
  return scrollY / (bodyScrollHeight - innerHeight);
}

/**
 * Galaxy camera Z position driven by scroll progress.
 * @param {number} scrollProgress  0–1.
 */
export function calcCameraZ(scrollProgress) {
  return 7 - scrollProgress * 3;
}

// ── Gallery helpers ───────────────────────────────────────────────────────

/** Photo card type for gallery index (cycles through TYPES array). */
export function getPhotoType(index) {
  return TYPES[index % TYPES.length];
}

/** Photo card category for gallery index (cycles through CATEGORIES array). */
export function getPhotoCategory(index) {
  return CATEGORIES[index % CATEGORIES.length];
}

/** Pixel dimensions for a given photo type key. */
export function getPhotoSizes(type) {
  return SIZES[type];
}

/** Zero-pad a number to two digits ('1' → '01', '12' → '12'). */
export function padNumber(n) {
  return String(n).padStart(2, '0');
}

// ── Galaxy geometry ───────────────────────────────────────────────────────

/**
 * Angle (radians) of a galaxy arm for a given particle index.
 * @param {number} index  Particle index.
 * @param {number} branches  Number of spiral arms.
 */
export function calcBranchAngle(index, branches) {
  return ((index % branches) / branches) * Math.PI * 2;
}

/**
 * Colour lerp factor between inner (orange) and outer (cyan) colour.
 * @param {number} r  Distance from galaxy centre.
 * @param {number} radius  Maximum galaxy radius.
 */
export function calcColorLerpFactor(r, radius) {
  return r / radius;
}

// ── Cursor & mouse ────────────────────────────────────────────────────────

/**
 * One smooth-follow step for the cursor ring.
 * @param {number} current  Current position.
 * @param {number} target   Target position (mouse).
 * @param {number} factor   Interpolation factor (e.g. 0.14).
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
