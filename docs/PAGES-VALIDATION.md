# GitHub Pages browser verification

Public URL: **https://reydereditor-del.github.io/3D-scroll-1/**. Verified on 30 October 2026 in Chromium 154.0.8037.57 using Playwright and a software WebGL renderer. These checks exercised the public HTTPS deployment, not just a local build.

The tested runtime comes from source commit `3dfedd4e11fcc5716103135e2c16d4cd8e9e850c`, published in artifact commit `82366b1eba787c3ecf049ca47850e81df3e6077c`. Its public HTML exactly matched `out/index.html` (SHA-256 `79e771a6993baf54b866d84493e9418ed02856a6f37ec8eca069ab490cf20b64`). Later documentation-only commits do not change these runtime files.

## Actual checks

- Desktop viewport 1440 × 1000, normal motion: five sections, one visible WebGL canvas, a loaded model and **LIVE 3D EXPERIENCE**. The observer recorded the real rendered Three.js camera and lighting through a test-only devtools hook.
- Forward scroll sampled 0, 2000, 3000 and 4500px; reverse returned through 2000px to 0. Camera positions changed with the story. At the shared 2000px position, maximum forward/reverse camera difference was **0**. Native wheel input also worked in both directions over the canvas.
- No uncaught page errors or HTTP responses of 400 or higher were observed in the desktop/mobile/reduced-motion browser workflow.
- Mobile at 390 × 844 and reduced motion at 1440 × 1000 used fresh browser contexts: five sections, no canvas, no pinned stage and **zero GLB requests**. The separate mobile walkthrough visits every section and waits for each still to decode and its heading reveal to finish.
- Public HTML, model and vehicle license returned HTTP 200. The 5,365,376-byte model exactly matched the committed debranded GLB (SHA-256 `82013690d6bc12e3439d39f86142d7aa93727816d076628f49cb21c520704582`).
- ESLint, TypeScript, regular Next.js production build, static Pages export and whitespace checks passed. The reusable deployment command published only generated files to `gh-pages`.

The implementation branch is `feat/nocturne-cinematic-studio`. `main` remains at `2b58ad7aeed41c4e8624c059e411ae54b42fac4b`; no merge was performed. No application dependency, paid service, redesign or accessibility fallback removal was needed for hosting.

These checks do not measure physical-GPU frame rate, real-device Core Web Vitals, Safari or Firefox compatibility.

## Public-site evidence

- [Desktop opening](pages-evidence/hero.png)
- [Desktop rear camera view](pages-evidence/performance.png)
- [Mobile after scrolling through all five sections](pages-evidence/mobile.png)
- [Rendered camera and fallback results](pages-evidence/results.json)
- [Mobile image/reveal results](pages-evidence/mobile-results.json)

See [deployment instructions](DEPLOYMENT.md) to rebuild and update the same address.
