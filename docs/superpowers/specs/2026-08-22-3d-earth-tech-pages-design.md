# IT ADIS — Realistic 3D Earth, Technology Pages, Logo & UX Overhaul

**Date:** 2026-08-22
**Status:** Approved

## Problem

Four independent problems, approved as one body of work:

1. **Backend build broken.** `npm start` failed with `Cannot find module dist/main`. *(Fixed before this spec was written.)*
2. **Logo renders incorrectly.** Font-dependent SVG `<text>`, a hardcoded dark crossbar that is invisible on light surfaces, asymmetric geometry in the inline variant, and no favicon or social preview image.
3. **The hero 3D scene is a generic orb.** It should be a realistic Earth with technology logos orbiting it, where clicking a logo opens a dedicated page about that technology.
4. **UX/UI defects**, the worst of which is that the site root `/` returns a 404.

## Root cause of the build failure

`prisma/seed.ts` sits outside `src/` but was not excluded from `tsconfig.build.json`. TypeScript computes the common root directory across all inputs, so including a file outside `src/` widened the inferred root to the project root. Output was emitted to `dist/src/main.js` while `npm start` looked for `dist/main.js`.

**Fix:** exclude `prisma` from the build and pin `rootDir: "./src"` so the failure mode is a loud compile error rather than silent path nesting.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Earth placement | Replaces the hero orb | Single focal point; no duplicate WebGL contexts |
| Logo click target | Dedicated route `/[locale]/tech/[slug]` | Linkable, indexable, SEO value — a modal has none |
| Earth realism | Real NASA texture maps | Procedural cannot produce real continents or city lights |
| Renderer | React Three Fiber | The hero already runs an R3F `<Canvas>`; raw three.js would mean two renderers |

## Architecture

```
frontend/
├─ middleware.ts                    NEW  / → /en redirect
├─ public/textures/earth/           NEW  day, night, clouds, bump maps
├─ public/tech/*.svg                NEW  vendor technology marks
├─ app/
│  ├─ icon.svg                      NEW  favicon
│  ├─ opengraph-image.tsx           NEW  social share card
│  └─ [locale]/tech/[slug]/page.tsx NEW  technology detail pages
├─ components/3d/TechEarth.tsx      NEW  Earth + orbiting logos
├─ components/ui/ITAdisLogo.tsx     REBUILT
└─ lib/tech-data.ts                 NEW  per-technology content
```

### Earth rendering

Four layers:

- **Surface** — custom `ShaderMaterial` blending the day map into the night-lights map by `dot(normal, sunDirection)`, so city lights emerge on the terminator as the globe turns. `MeshStandardMaterial` cannot express this; that limitation is why the existing `EarthModel.tsx` looks flat.
- **Clouds** — separate transparent sphere at r=1.01 rotating slightly faster than the surface.
- **Atmosphere** — fresnel rim-glow shell tinted brand green.
- **Stars** — drei `<Stars>`, already present in the scene.

### Orbiting technology nodes

Billboarded chips carrying real vendor marks, distributed across three inclined orbital planes rather than one flat ring, so the composition reads as a system rather than a diagram.

Accessibility is a first-class requirement, not a follow-up: an overlay of real `<a href>` elements is positioned above the canvas so the nodes are keyboard-focusable, screen-reader-announced, and openable in a new tab. The nodes being pointer-only mesh handlers is a defect of the current implementation.

The scene renders on mobile at reduced fidelity (fewer segments, halved DPR, no cloud layer). It is currently `hidden lg:flex`, which leaves phone visitors with only an emoji grid.

### Technology pages

`/[locale]/tech/[slug]` for `python`, `javascript`, `frontend`, `vibe-coding`, `ai`, `data-science`. Statically generated across all three locales with per-page `generateMetadata`. Each page covers: what the technology is, why it is worth learning, what the student builds, career paths and salary ranges, a learning roadmap, and a CTA into the matching course.

All copy lives in `lib/tech-data.ts` and the three message files. No hardcoded English.

### Logo

The wordmark becomes outlined paths, so it renders identically whether or not Space Grotesk loads. The crossbar becomes a true transparent cutout via `fill-rule` instead of a `#040d07` rectangle that only disappears against the dark theme. Geometry is corrected for symmetry, and a monochrome variant covers light surfaces.

## UX/UI defects

| Severity | Defect |
|---|---|
| Critical | `/` returns 404 — no middleware, no root page |
| High | No favicon; no social preview image |
| High | 3D hero hidden entirely on mobile |
| High | Hardcoded English in `Hero.tsx` leaks into the RU and KG locales |
| Medium | 3D nodes unreachable by keyboard; no focus states |
| Low | Dead code — unused `t` in `MobileTechGrid`, unused `groupRotation` prop on `TechNode` |

## Sequencing

1. Audit and critical fixes
2. Logo and favicons
3. Earth
4. Technology pages
5. Verification

## Verification

The repository has no test infrastructure, so completion is evidenced by: `next build` passing, `tsc --noEmit` clean, and a headless browser load of each new route confirming zero console errors and correct render. Claims of success require command output, not assertion.

## Third-party assets

NASA texture maps and vendor technology marks are public domain or CC0. They are committed into the repository.
