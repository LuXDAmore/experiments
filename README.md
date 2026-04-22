# experiments

A **monorepo** of interactive frontend portfolio experiments built with ThreeJS, GSAP, Lenis, and TailwindCSS.

Each experiment is self-contained — a single `index.html` with all assets — and lives in its own package under `packages/`.

---

## Structure

```
experiments/
├── package.json                          ← monorepo root (npm workspaces)
└── packages/
    ├── landing/                          ← Visual index of all experiments (port 3000)
    │   ├── package.json
    │   └── index.html
    ├── experiment-01/                    ← CHROMATIC — photography scroll experience
    │   ├── package.json
    │   └── index.html
    ├── experiment-02/                    ← VORTEX — abstract 3D space journey
    │   ├── package.json
    │   └── index.html
    ├── experiment-03-hinatabokko/        ← HINATABOKKO — Japanese sunset
    │   ├── package.json
    │   └── index.html
    ├── experiment-04-mono-no-aware/      ← MONO NO AWARE — cherry blossoms
    │   ├── package.json
    │   └── index.html
    └── experiment-05-komorebi/           ← KOMOREBI — forest dappled light
        ├── package.json
        └── index.html
```

---

## Experiments

### Landing · EXPERIMENTS INDEX
*A visual grid index linking to every experiment.*

- Staggered GSAP entrance with per-card accent colours
- Custom cursor that changes colour on hover to match each experiment's palette
- Responsive auto-fill grid with minimal dark aesthetic

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

### 03 · HINATABOKKO 日向ぼっこ
*A cinematic Japanese sunset — golden hour fading into night.*

- **ThreeJS** fullscreen sky `ShaderMaterial` with FBM noise cloud layers
- Animated procedural sun with lens-glow bloom
- Scroll-driven sky gradient: gold → deep orange → crimson → violet dusk → night
- **GSAP ScrollTrigger** horizontal card gallery (five sunset phases), photo parallax
- Dynamic CSS custom-property palette updated every frame
- Custom cursor, lightbox, `prefers-reduced-motion` guard

### 04 · MONO NO AWARE 物の哀れ
*The bittersweet awareness of impermanence — cherry blossoms and the Japanese aesthetic.*

- **ThreeJS** sky gradient shader (night violet → pale pink → bright noon → deep rose)
- 500-particle falling cherry-blossom system with per-petal rotation, vein detail, and sway physics
- Scroll-driven colour palette (sakura pink to twilight)
- **GSAP** letter entrance, scroll reveals, horizontal seasonal scroll gallery
- Custom petal cursor, lightbox, `prefers-reduced-motion` guard

### 05 · KOMOREBI 木漏れ日
*Sunlight filtering through the leaves — the light you can see but never hold.*

- **ThreeJS** three-band forest gradient `ShaderMaterial`: forest floor → canopy → sky
- FBM-noise **komorebi dapple** — animated soft light spots on the canopy band
- **Crepuscular light rays** radiating from a moving sun position above the frame
- 350-particle **floating leaf** system with per-leaf rotation, sway physics, and elliptical leaf shape with central vein
- Scroll-driven colour transitions: morning mist → golden dawn → noon → amber → forest dusk
- **GSAP** hero entrance, scroll reveals, parallax, pinned horizontal seasonal gallery
- Custom leaf cursor, lightbox, `prefers-reduced-motion` guard

---

## Tech stack (per experiment, loaded via CDN)

| Library | Version | Role |
|---------|---------|------|
| [Three.js](https://threejs.org) | 0.169 | 3D rendering / WebGL |
| [GSAP](https://gsap.com) | 3.12.5 | Animations + ScrollTrigger |
| [Lenis](https://lenis.darkroom.engineering) | 1.0.42 | Smooth scroll |
| [TailwindCSS](https://tailwindcss.com) | Play CDN v4 | Utility CSS |

---

## Running locally

```bash
# Serve landing index (port 3000)
npm run serve:landing

# Serve experiment 01 (port 3001)
npm run serve:01

# Serve experiment 02 (port 3002)
npm run serve:02

# Serve experiment 03 (port 3003)
npm run serve:03

# Serve experiment 04 (port 3004)
npm run serve:04

# Serve experiment 05 (port 3005)
npm run serve:05
```

Or open any `index.html` directly in a modern browser — no build step needed.

---

## Notes

- Placeholder photographs are served by [picsum.photos](https://picsum.photos) and can be replaced with real images.
- All experiments are fully **responsive** and respect `prefers-reduced-motion`.
- Custom cursors are hidden automatically on touch/coarse-pointer devices.
- WebGL is detected at runtime; experiments gracefully fall back to CSS-only backgrounds when unavailable.
