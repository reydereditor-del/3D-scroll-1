# NOCTURNE — cinematic studio

The agreed direction is a quiet, dark automotive studio: a short light reveal, a camera-led scroll story, restrained typography and interface motion, and a composed return to the opening view. The existing Hero, Design, Performance, Details and Final CTA sections and their copy remain. This follows the user's approved written direction, not a claim of fidelity to an external reference site.

## Motion and composition

One native-scroll pinned stage drives a GSAP timeline. There is no wheel interception or additional scrolling library. Its distance is 5.5 viewport heights, with a short numeric scrub to soften input. Camera coordinates interpolate in polar space, so the camera orbits around the vehicle rather than cutting through it during front/rear transitions.

| Scene | Camera and lighting | Text and interface |
| --- | --- | --- |
| Hero | Front three-quarter; lighting opens from a silhouette after the model commits | Short line reveal; no blocking loading screen |
| Design | Low side profile; key light moves across the body | Masked heading reveal and a quiet material note |
| Performance | Low rear three-quarter; restrained red rim light | Text composes on the opposite side of the vehicle |
| Details | Closer front bodywork/wheel framing; focused key light | Material annotation, with the existing copy |
| Finale | Pull back into the opening angle before unpinning | Details recedes; final heading reveals over a gently moving studio still |

Each chapter includes a camera hold. Chapter buttons land after transitions have completed. The chapter rail shows native-scroll progress; links and buttons have restrained hover/focus states and accessible hit targets.

The studio environment is authored in Three.js from emissive softbox planes and baked once per renderer with PMREM. Three inexpensive directional lights provide the animated key, red rim and fill. A soft procedural contact shadow grounds the car. Rendering remains on demand, with capped pixel ratio, no postprocessing or realtime shadow maps, and no external HDRI request. Existing renderer/context cleanup and model failure handling are retained.

## Assets and typography

The existing debranded CC BY 4.0 vehicle and its four posters are reused. No replacement model, purchased asset, stock footage, API, subscription or application dependency was added. Runtime graphite, alloy and glass materials are tuned in the scene; the committed GLB is unchanged. Vehicle rights and attribution remain in [asset provenance](ASSET-PROVENANCE.md) and the existing on-page credits.

Two fonts were downloaded from Google's official open font repository and are self-hosted through `next/font/local`:

- Manrope variable: https://github.com/google/fonts/tree/main/ofl/manrope — copyright The Manrope Project Authors, SIL OFL 1.1. Unmodified file: `public/fonts/manrope-variable.ttf`; full license: `public/licenses/manrope-OFL.txt`.
- Instrument Serif italic: https://github.com/google/fonts/tree/main/ofl/instrumentserif — copyright The Instrument Serif Project Authors, SIL OFL 1.1. Unmodified file: `public/fonts/instrument-serif-italic.ttf`; full license: `public/licenses/instrument-serif-OFL.txt`.

Combined source font size is 236,292 bytes. Browser font requests stay local; builds do not need Google Fonts access.

## Accessible alternatives

Below 1024px the existing image edition stays in normal document flow without a GLB request. Normal-motion mobile adds only short text reveals. Reduced motion removes pinning, camera/lighting animation, text reveals, parallax and CSS transitions; desktop uses a static two-column composition. JavaScript-disabled rendering keeps all five sections and vehicle stills visible. Loading, model errors and genuine WebGL loss retain the studio poster. Responsive/motion-mode reentry resets readiness and can recover a fresh live scene.

## Repeatable browser check

Use Node 20.9+ (validated with Node 24), npm, and Chromium at `/usr/bin/chromium`. Optional Playwright stays outside application dependencies:

```sh
npm ci --no-audit --no-fund
npm run build
npm run typecheck
npm run lint
npm install --prefix /tmp/nocturne-browser playwright@1.64.1 --no-audit --no-fund
NODE_PATH=/tmp/nocturne-browser/node_modules node scripts/verify-3d-browser.mjs
```

The runner owns and closes its production server (port 3200 must be free). It writes screenshots and a JSON report to `/tmp/nocturne-browser-evidence`; set `EVIDENCE_DIR` for another destination. Three.js's devtools observer is injected only by the test to record actual rendered camera positions, light values and render counters. The production app exposes no test globals. Condition-based waits cover numeric scrub and lighting completion rather than assuming a fixed delay on software GPUs.

The assertions cover visible 3D and light opening; forward/reverse canvas output; safe camera distance; chapter navigation; wheel input; reload; final replay; responsive/motion reentry; delayed/failed loading; lost/unavailable WebGL; mobile/tablet/reduced-motion/JavaScript-disabled fallbacks; keyboard skip link; lazy images and horizontal overflow. Expected injected asset failure is kept separate from normal model response failures.

Browser evidence and actual results for this change are recorded alongside the final implementation. These local software-WebGL checks do not establish physical-GPU frame rate, Safari/Firefox compatibility or real-device Core Web Vitals. No deployment or merge is performed by the runner.

## Recorded validation

The full Chromium regression completed with zero uncaught page errors and zero failed normal model responses. It exercised rendered light opening, forward/reverse camera output, chapter controls, native wheel input, mid-story reload, final replay, delayed model loading, responsive reentry, two reduced-motion cycles, genuine GPU context loss, unavailable WebGL, failed model loading, mobile/tablet/reduced-motion and JavaScript-disabled content, and the keyboard skip link.

After refining only the side-profile framing, the affected lighting, complete forward/reverse camera path and chapter navigation checks were repeated. At the sampled reverse position, measured camera delta was **0** and changed canvas pixels were **0**. The opening canvas also matched exactly after returning to the top. The side profile now fits entirely within the desktop composition.

Final CSS refinements were checked separately: white CTA text has measured contrast of approximately **5.02:1** normally and **6.11:1** on hover; expanded credits stay in flow below content at mobile/tablet/reduced-motion sizes. These are targeted checks, not a claim of a full accessibility audit. See the reports for their exact tested states.

- [Full browser workflow report](cinematic-evidence/browser-results.json)
- [Final camera/framing report](cinematic-evidence/framing-results.json)
- [Final CTA/responsive UI report](cinematic-evidence/ui-results.json)

Actual browser screenshots:

- [Hero — lit front view](cinematic-evidence/hero.png)
- [Design — complete side profile](cinematic-evidence/design.png)
- [Performance — rear studio view](cinematic-evidence/performance.png)
- [Details — close framing](cinematic-evidence/details.png)
- [Final CTA](cinematic-evidence/final.png)
- [Mobile — all five sections](cinematic-evidence/mobile.png)
- [Reduced motion — static desktop](cinematic-evidence/reduced.png)
- [Mobile — expanded credits](cinematic-evidence/mobile-credits.png)

The full workflow run preceded the final framing-only and CSS-only refinements; the two focused reports cover those changes. Final production build, strict TypeScript, ESLint, asset provenance verification and whitespace checks passed. Application manifests and lockfile stayed unchanged. The final CTA UI capture uses the WebGL-unavailable edition to check its DOM/CSS independently; live 3D evidence comes from the camera/framing run.
