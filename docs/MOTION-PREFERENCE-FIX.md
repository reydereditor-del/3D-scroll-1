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
