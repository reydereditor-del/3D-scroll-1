# 3D visibility and scroll regression — 2026-10-30

This records the preceding focused lifecycle fix. For the subsequently approved cinematic presentation, see [CINEMATIC-STUDIO.md](CINEMATIC-STUDIO.md).

## Diagnosis

Base: `main`, `2b58ad7aeed41c4e8624c059e411ae54b42fac4b`.

A fresh production page at 1440×1000, with reduced motion off and WebGL2 available, already loaded `/models/concept.glb` (HTTP 200), displayed the live canvas, and created one ScrollTrigger pin. A universal first-load production failure was not reproduced. The initial existing development server instead remained at the server-rendered poster with no canvas/pin and a failing HMR connection. That observation is distinct from the confirmed application lifecycle defect below; this change does not claim to fix arbitrary script delivery or browser/GPU failures.

Confirmed reproduction: load live desktop → resize to 768px → return to 1440px. Before the fix, the page could stay at `STUDIO VIEW / 3D UNAVAILABLE`, with no live canvas. The context-loss handler installed by `Canvas.onCreated` was never removed. React Three Fiber intentionally destroys its WebGL context when unmounting; the leftover listener reported normal teardown as a failure. `assetFailed` then survived subsequent desktop entries and prevented remounting the vehicle. Readiness also survived mode changes, which could hide the poster before the replacement scene loaded.

## Focused fix

- Register context-loss handling in the scene's effect, with symmetric listener removal before renderer teardown. Real context loss still activates the fallback.
- Reset model failure/readiness on each eligible desktop entry. Keep the poster until that new model load succeeds.
- Preserve the existing media conditions (1024px+, reduced motion off), camera poses, GSAP timeline, design, content, CSS, model, and accessibility fallbacks.

## Browser evidence

Real headless Chromium 154.0.8037.57, Playwright 1.64.1, Linux SwiftShader software WebGL2. Production build, desktop viewport 1440×1000, device scale factor 1, reduced motion `no-preference`.

- Model returned 200; canvas computed opacity 1; one canvas and one pin.
- Scroll positions 0 → 1000 → 2000 → 3000 → 4000 → 3000 → 2000 → 1000 → 0 changed the vehicle view. Canvas-only screenshot hashes differ between positions and match exactly on return to each sampled position. This measures the rendered WebGL output independently of changing DOM chapter text.
- Native wheel input scrolled forward and reverse over the canvas.
- Mid-story reload restored scroll position 3000.
- Tablet→desktop reentry recovered a live scene. A deliberately delayed GLB request kept the poster visible with `LOADING 3D / STUDIO VIEW`, then switched back to live 3D.
- Two reduced-motion→desktop cycles each ended with one live canvas and one pin.
- Genuine `WEBGL_lose_context` on the live renderer retained the poster and reported 3D unavailable.
- Fresh 390×844 mobile, 768×900 tablet, and 1440×1000 reduced-motion pages: no model requests, all five sections visible, no horizontal overflow.
- WebGL disabled and model-request failure: poster remained visible. The intentionally failed request is separate from normal model loading.
- No uncaught page exceptions or non-200 normal model responses in the completed run.
- `npm run build`, `npm run typecheck`, `npm run lint`, and `git diff --check` passed.

Screenshots are actual browser captures:

- [Before: desktop reentry stuck in fallback](3d-scroll-evidence/before-reentry.png)
- [After: live front view](3d-scroll-evidence/after-hero.png)
- [After: forward scroll, rear view](3d-scroll-evidence/after-forward-3000.png)
- [After: reverse scroll back to front view](3d-scroll-evidence/after-reverse-hero.png)
- [Machine-readable browser results and canvas hashes](3d-scroll-evidence/browser-results.json)

## Repeat the browser regression

Requires the repository's normal installed dependencies and system Chromium at `/usr/bin/chromium`. Temporary test tooling is kept outside the checkout; no app dependencies or lockfiles changed:

```sh
cd /workspace/3D-scroll-1
npm run build
npm install --prefix /tmp/nocturne-browser playwright@1.64.1 --no-audit --no-fund
NODE_PATH=/tmp/nocturne-browser/node_modules node scripts/verify-3d-browser.mjs
```

The runner owns a production server on port 3200 (which must be free), executes assertions and captures screenshots/results under `/tmp/nocturne-browser-evidence`. Set `EVIDENCE_DIR` to choose a different output directory. It also exercises native wheel input in both directions. It does not contact paid services or modify application dependencies.

These checks do not establish hardware-GPU performance, Safari/Firefox behavior, or the cause of a failure on an unspecified deployed URL/browser. No deployment or merge was performed.
