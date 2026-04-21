# experiments

A **monorepo** of interactive frontend portfolio experiments built with ThreeJS, GSAP, Lenis, and TailwindCSS.

Each experiment is self-contained — a single `index.html` with all assets — and lives in its own package under `packages/`.

---

## Structure

```
experiments/
├── package.json          ← monorepo root (npm workspaces)
└── packages/
    ├── experiment-01/    ← CHROMATIC — photography scroll experience
    │   ├── package.json
    │   └── index.html
    └── experiment-02/    ← VORTEX — abstract 3D space journey
        ├── package.json
        └── index.html
```

---

## Experiments

### 01 · CHROMATIC
*A scroll-driven photographic journey through color, light, and motion.*

- **ThreeJS** galaxy particle system (6 000 particles, additive blending, mouse parallax)
- **GSAP** hero letter-by-letter entrance, horizontal gallery scroll with `ScrollTrigger` pin, featured-works reveal
- **Lenis** ultra-smooth scroll integrated with GSAP ticker
- **TailwindCSS** play CDN with custom design tokens
- 60 placeholder photographs in a pinned horizontal track
- Custom cursor with smooth lag ring

### 02 · VORTEX
*An abstract journey through geometric 3D space driven by scroll.*

- **ThreeJS** scene: 60+ torus knots, icosahedrons, octahedrons with emissive neon materials
- **Bloom post-processing** (`EffectComposer` + `UnrealBloomPass`) — intensity rises as you scroll deeper
- Camera travels a **CatmullRom curve** through the scene, driven by `ScrollTrigger`
- Animated **point lights** orbit the scene
- **Lenis** smooth scroll + GSAP text panel reveals per phase
- 5-phase narrative: Entry → Emergence → Expansion → Convergence → Terminus

---

## Tech stack (per experiment, loaded via CDN)

| Library | Version | Role |
|---------|---------|------|
| [ThreeJS](https://threejs.org) | 0.169 | 3D rendering / WebGL |
| [GSAP](https://gsap.com) | 3.12.5 | Animations + ScrollTrigger |
| [Lenis](https://lenis.darkroom.engineering) | 1.0.42 | Smooth scroll |
| [TailwindCSS](https://tailwindcss.com) | Play CDN | Utility CSS |

---

## Running locally

```bash
# Serve experiment 01 (port 3001)
npm run serve:01

# Serve experiment 02 (port 3002)
npm run serve:02
```

Or open the HTML files directly in any modern browser — no build step needed.

---

## Notes

- Placeholder photographs are served by [picsum.photos](https://picsum.photos) and can be replaced with real images.
- Both experiments are fully **responsive** and respect `prefers-reduced-motion`.
- Custom cursor is hidden automatically on touch/coarse-pointer devices.
