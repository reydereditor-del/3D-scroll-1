# Reduced-motion discoverability and explicit opt-in

The user's screenshot showed the wide two-column still edition: a rectangular vehicle poster, no chapter rail and no central studio header text. That layout is selected by the desktop `prefers-reduced-motion: reduce` CSS rule. It is distinct from a model-loading failure, which retains the pinned studio composition.

The same state was reproduced on the public site at 1806 × 855 with reduced motion enabled. Browser measurements confirmed `heroLayout: grid`, `sceneDisplay: none`, no canvas and no model request. This reproduces the screenshot's presentation; it does not inspect or change the user's actual operating-system settings.

The missing behavior was an explanation and an accessible way to choose the full experience on the site. The default still edition remains. Desktop visitors now see **Reduced motion is on** with **Enable 3D & motion** in the header. This explicit choice enables both the GSAP timeline and the corresponding CSS presentation, while the operating-system media query continues to report reduced motion. **Use device settings** restores the default. The choice is kept only for the current session and still works in memory when browser storage is blocked. Mobile keeps its lightweight image edition.

The WebGL-unavailable state now also reports **STUDIO VIEW / 3D UNAVAILABLE** when desktop motion was requested, instead of silently reporting the generic studio edition. Posters and semantic content remain available.

## Repeat the focused browser check

Use the existing optional Playwright setup from [the cinematic notes](CINEMATIC-STUDIO.md), build with `npm run build:pages`, and serve `out/` under `/3D-scroll-1/`. Then run:

```sh
NODE_PATH=/tmp/nocturne-browser/node_modules \
BASE_URL=http://127.0.0.1:3300/3D-scroll-1/ \
EVIDENCE_DIR=/tmp/nocturne-motion-evidence \
node scripts/verify-motion-browser.mjs
```

`BASE_URL` can also point at the public deployment. The runner records actual rendered camera values using a test-only Three.js observer. It checks the reduced default, keyboard opt-in, real text transforms, visible WebGL, forward/reverse camera movement, native wheel input, session reload, resize, reset, live OS preference changes, blocked storage and unavailable WebGL. It does not force the media query to normal motion to make the opt-in test pass.

Actual local and public results and screenshots are recorded in `motion-evidence/`. Software WebGL checks do not establish physical-GPU frame rate or Safari/Firefox compatibility. No redesign, new application dependency or removal of the reduced-motion fallback was needed.

## Verified public result

The full public regression passed at **https://reydereditor-del.github.io/3D-scroll-1/?v=3157479** on 30 October 2026. The runtime source is `3157479ae04c0bad369378c6b1e2a8430cf25888`, deployed in Pages artifact `f1a2cd836f030ed13e41df8c6e5e73026d632e7a`. Public HTML matched the exported HTML exactly (SHA-256 `73831f3c388f02a72f43bccca6d4f643b7fa52232e88009512011793492d4249`).

In Chromium at 1440 × 1000, with reduced motion still enabled, keyboard activation of the opt-in produced a visible canvas, real heading transforms and rendered camera movement. Forward/reverse samples at the same position had maximum camera delta **0**. Mid-story reload, subsequent mode switches without stale scroll jumps, resize, reset, live OS preference changes, blocked storage and unavailable WebGL all passed. The final run recorded **zero console/page errors and zero failed HTTP responses**.

The control also remained visible at a 1024px desktop viewport and at 1445 × 684 with a 1.25 display scale (1806 × 855 output). Both reduced defaults made zero model requests. One initial public attempt recorded an HTTP 503; the complete rerun was clean, and a separate availability check of all **35 runtime assets** returned HTTP 200. No persistent asset failure was reproduced.

- [Reduced default with the enable button](motion-evidence/reduced-default.png)
- [Enable control close-up](motion-evidence/enable-control.png)
- [Actual public 3D opening after opt-in](motion-evidence/hero.png)
- [Actual public rear view after scrolling](motion-evidence/rear.png)
- [Full public browser results](motion-evidence/public-results.json)
- [Desktop boundary and display-scale checks](motion-evidence/header-results.json)
- [Runtime asset responses](motion-evidence/asset-responses.json)

The fix is committed on `fix/motion-preference-controls`. No merge into `main` was performed.
