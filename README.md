# HEXA — The Corner Series

Scroll-driven 3D marketing site for **The Corner Series**: six compact round speakers that mount into the corners of a room with an adhesive corner plate and a magnetic snap.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · React Three Fiber + drei + three.js · @react-three/postprocessing · GSAP + ScrollTrigger · Lenis · Framer Motion · Web Audio API (HRTF `PannerNode`). Ready to deploy on Vercel.

```bash
npm install      # also copies the Draco decoder into public/draco
npm run dev      # http://localhost:3000
npm run build && npm start
```

Deploy: push to a Git repo and import it in Vercel. No environment variables are required (see `NEXT_PUBLIC_MODEL_SOURCE` below).

---

## Page structure

| # | Section | Component | 3D scene | Behaviour |
|---|---------|-----------|----------|-----------|
| 1 | Hero | `sections/Hero.tsx` | `scenes/HeroScene.tsx` | Pinned. A hero speaker with five more drifting in the dark around it (fog for depth, mouse parallax). On scroll all six fly into a hexagon and blue sound rings flow to the centre. "Hear it" turns sound on and starts the demo. |
| 2 | Exploded view | `sections/ExplodedView.tsx` | `scenes/ExplodedScene.tsx` | Pinned, scroll-scrubbed. Five layers separate along Z with thin-line callouts, then reassemble. On mobile the stack explodes vertically. |
| 3 | The Snap | `sections/Snap.tsx` | `scenes/SnapScene.tsx` | Pinned. The plate presses into a ceiling corner, then the speaker flies in and snaps with a micro-bounce and an amber flash. The click plays only if sound is on. |
| 4 | Six corners | `sections/SixCorners.tsx` | `scenes/RoomScene.tsx` | Pinned. Pulls back from the corner to a cut-away living room. Six speakers appear one by one, and blue rings converge on the sofa's sweet spot. |
| 5 | Spatial demo | `sections/SpatialDemo.tsx` | — (SVG plan) | "Orbit", a ~20 s synthesised piece. A Dmaj9 → Bm9 → Gmaj9 chord has one voice pinned to each speaker, a music-box melody and shimmer trail fly a lap through every corner on a moving HRTF `PannerNode`, a bell rings as it passes each speaker, and everything sits in a generated reverb. The active speaker glows. |
| 6 | Features | `sections/Features.tsx` | — | Four cards with line icons and a hover lift. |
| 7 | Specs | `sections/Specs.tsx` | `scenes/SpecScene.tsx` | Spec table beside a slowly rotating model. |
| 8 | In the box | `sections/InTheBox.tsx` | `scenes/UnboxingScene.tsx` | Pinned. The lid lifts away to reveal a 3 × 2 foam tray. |
| 9 | Premium finish | `sections/PremiumFinish.tsx` | `scenes/MacroScene.tsx` | Macro dolly along the serrated ring, depth of field (desktop). |
| 10 | Waitlist | `sections/Waitlist.tsx` | — | Email capture, live counter, six-speaker pulse on success. API: `app/api/waitlist/route.ts`. |
| 11 | FAQ | `sections/FAQ.tsx` | — | Accessible accordion. |
| 12 | Footer | `layout/Footer.tsx` | — | Logo, socials, legal links. |

```
src/
  app/                 layout, page, global styles, /api/waitlist
  components/
    layout/            Nav (audio toggle), Footer, GrainOverlay
    providers/         AudioProvider, SmoothScroll (Lenis ↔ GSAP), Providers
    sections/          one component per page section
    three/
      SceneCanvas.tsx  lazy mount, offscreen pause, DPR cap, WebGL fallback
      GLCanvas.tsx     the R3F <Canvas> (own chunk, so three.js isn't in the first load)
      StudioLights.tsx warm low key, amber rim, network-free environment map
      models/          procedural speaker: geometry, PBR materials, textures, <Speaker>
      scenes/          one component per 3D scene (each code-split)
    ui/                Button, Reveal, Text (placeholder-aware), Logo
  hooks/               useScrubProgress, useReducedMotion / useIsMobile, useWebGL
  lib/
    content.ts         ALL copy — edit here
    config.ts          model source, GLB path, Draco path, waitlist seed count
    audio/engine.ts    Web Audio: click, chime, HRTF spatial demo (all synthesised)
    audio/speakers.ts  room + six speaker positions shared by 3D, plan and audio
```

### How scroll choreography works

Pinned sections are tall `<section>`s with a `sticky` full-screen child. `useScrubProgress` creates a ScrollTrigger and writes 0→1 progress into a ref. Scenes read that ref in `useFrame` and damp toward it, so 3D motion stays smooth even with trackpad jitter. HTML copy is updated in the same `onUpdate` callback by writing styles directly, with no React re-renders per frame. Lenis drives smooth scrolling from GSAP's ticker, so the two stay in lockstep.

---

## Placeholders (search for `ph(` and `PLACEHOLDER`)

Everything not final is visibly marked on the page with a dashed **TBD** chip, so it can't ship unnoticed.

| What | Where |
|------|-------|
| Connectivity, mount hold rating | `lib/content.ts` → `specs` |
| Cables / charger in the box | `lib/content.ts` → `inTheBox.items` |
| Founding price / RRP | `lib/content.ts` → `waitlist.pricing` |
| FAQ answers that depend on undecided specs | `lib/content.ts` → `faq` |
| Waitlist seed count | `lib/config.ts` → `WAITLIST_BASE_COUNT` |
| Waitlist storage (in-memory) | `app/api/waitlist/route.ts` |
| Social / legal URLs | `lib/content.ts` → `footer` |
| City-window art, TV still, lid wordmark | `components/three/models/textures.ts` |
| WebGL fallback images | `public/fallbacks/placeholder-*.svg` |
| Product model (procedural) | `components/three/models/` |

---

## Swapping in real assets

### 1. Product GLB

1. Export the speaker from your CAD/DCC tool as glTF. Use **metres ÷ 10** (1 unit = 10 cm), the grille facing **+Z**, and the back of the housing at **z = 0**. That matches the procedural model, so cameras and animations keep working.
2. Name the layer nodes exactly:

   | Node | Contains |
   |------|----------|
   | `Grille` | fabric grille |
   | `Driver` | cone, surround, dust cap, basket, motor |
   | `Housing` | ABS shell **and** serrated ring |
   | `MagnetDisc` | magnetic snap core on the back of the puck |
   | `CornerPlate` | triangular adhesive plate + its steel contact disc |

   Each node's origin should be its **assembled** position. The exploded view offsets the nodes along Z from there.
3. Compress with Draco:
   ```bash
   npx @gltf-transform/cli optimize hexa-speaker.glb public/models/hexa-speaker.glb --compress draco --texture-compress webp
   ```
4. Set `NEXT_PUBLIC_MODEL_SOURCE=glb` (in `.env.local` or the Vercel project settings).

The GLB is decoded with the self-hosted Draco decoder in `/public/draco` (copied from three.js by `scripts/copy-draco.mjs` on install), and it is cache-headered as immutable in `next.config.mjs`.

### 2. Textures and materials

PBR materials live in `components/three/models/materials.ts`. The fabric colour and normal maps are generated procedurally in `textures.ts`. To use photographed or baked maps, load them with drei's `useTexture` and pass them to the `grille` material, or just ship them inside the GLB.

### 3. Product renders and fallback images

`public/fallbacks/placeholder-*.svg` are shown when WebGL is unavailable or a scene throws. Replace them with real renders (WebP/AVIF recommended) and update the `src` in each section's `<SceneFallback>`.

### 4. Fonts

The display face is Archivo at an expanded width, and the body is Inter (both via `next/font/google`). To use **Neue Montreal** (licensed):

```ts
// src/app/layout.tsx
import localFont from 'next/font/local';
const display = localFont({ src: './fonts/NeueMontreal-Regular.woff2', variable: '--font-display' });
```

Then remove `font-stretch` from `.display` in `globals.css` if the new face has no width axis.

### 5. Audio

All sound is synthesised in `lib/audio/engine.ts`, so there are no files to download. To use recorded audio (a real click, a mixed demo track), `fetch` the file, decode it with `ctx.decodeAudioData`, and play it through the same `master` gain, or through the `panner` for the demo.

### 6. Waitlist backend

`app/api/waitlist/route.ts` stores emails in memory. That resets on deploy and isn't shared between serverless instances. Replace the `store` with your provider (Resend Audiences, Klaviyo, Mailchimp, Supabase, Vercel KV…) and return the real count from `GET`.

---

## Performance

- Each 3D scene is its own dynamic chunk. three.js and R3F load only when the first scene mounts (the first-load JS for `/` is about 190 kB).
- `SceneCanvas` mounts a WebGL context only when its section is within one viewport. It pauses the render loop (`frameloop="never"`) while offscreen and caps DPR at 2 (1.5 on mobile).
- Mobile (`max-width: 767px` or a coarse pointer) gets simplified scenes: no MSAA, no post-processing (bloom/DOF), no contact shadows, fewer particles and rings, and the driver mesh is skipped.
- Geometry, materials and textures are built once and shared across canvases.
- The environment map is generated from `Lightformer`s, so no HDR is fetched.

## Accessibility

- **Sound is off by default.** Nothing plays until the user presses the nav toggle, "Hear it" or "Play demo", and the snap click and waitlist chime respect the toggle.
- `prefers-reduced-motion`: Lenis is disabled, pinned sections collapse to one screen with a single meaningful still (exploded and labelled, snapped, all six corners, box open), Framer animations fade without movement, and the grain stops.
- WebGL unavailable or scene error: static fallback image.
- Skip link, focus rings, `aria-pressed` on toggles, an accessible FAQ accordion, `aria-live` status for the demo and form, and screen-reader text for the 3D callouts.
