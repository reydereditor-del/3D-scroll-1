# Validation

Historical baseline checks are recorded below. For the current cinematic presentation and its actual browser evidence, see [CINEMATIC-STUDIO.md](CINEMATIC-STUDIO.md).

## Commands executed successfully

- `npm ci --no-audit --no-fund`: lockfile installation verified with Node 24.19.0 / npm 11.9.0.
- `npm run dev`: webpack development server started; browser HTTP requests returned 200 and the final responsive audit completed without page errors.
- `npm run lint`: no errors or warnings in the application.
- `npm run typecheck`: passed strict TypeScript checking.
- `npm run build`: production static page build passed using webpack.
- `python scripts/verify-asset.py`: passed; 5,365,376 bytes, seven replacement materials, no images, textures, material variants, or named branding nodes. Attribution license present.
- `git diff --check`: passed.

The original Turbopack build failed because its PostCSS worker could not bind an internal port in this environment. The repository scripts use the supported webpack mode. Blender initially failed on unavailable denoising support; denoising was disabled and all four renders completed.

## Browser checks actually performed

Headless local Chromium with SwiftShader software WebGL, using the production server. Temporary Playwright tooling was installed outside the repository, not added to app dependencies.

- 1440×1000 desktop: five sections, live model loaded, chapter controls switched to their corresponding visible text panels; all other panels hidden. Forward chapter navigation and return to top exercised.
- 390×844 mobile and 768×900 tablet: normal reading flow, all five sections visible, no horizontal overflow. Mobile requested no GLB. Replay CTA returned to scroll position zero.
- 1440×1000 reduced motion: static reading flow, no GLB request, no horizontal overflow.
- Simulated WebGL unavailability: poster experience and chapter controls remained usable, no model request.
- Simulated GLB network failure: studio poster retained, explicit unavailable status, no uncaught page exception.
- Desktop mid-story reload: restored Details after pin spacing initialization; this initially failed and was corrected.
- Desktop-to-mobile resize: all chapter text visible; zero remaining pin spacers.
- Lazy Details poster loaded successfully on mobile scroll approach (1500×900 source); keyboard Tab initially focused the skip link.
- JavaScript disabled: all five sections visible with no horizontal overflow.
- Screenshot inspection included desktop Hero and chapter views, full mobile layout, tablet layout, reduced-motion output, and source-derived front/side/rear/detail stills. No visible Khronos or 3D Commerce marks remained in the inspected views.

The corrected browser audit reported zero uncaught page errors and zero HTTP failures in normal desktop/mobile/reduced/WebGL-disabled runs. Earlier screenshots exposed a bright floor, text overlap, and canvas boundaries; those were corrected with a dark unlit floor, full-stage rendering, and camera framing offsets.

## Asset transfer sizes

- Debranded GLB: 5,365,376 bytes (5.37 MB decimal).
- Hero WebP: 115,986 bytes.
- Design WebP: 117,332 bytes.
- Performance WebP: 104,696 bytes.
- Details WebP: 141,270 bytes.
- All four posters together: 479,284 bytes. Later mobile chapter images are lazy-loaded.

## Limits

- Supplied reference sites returned proxy HTTP 403; no screenshots from those sites were inspected, and no claim of reference fidelity is made.
- These checks establish local Chromium behavior. Safari, Firefox, physical phones, hardware-GPU frame rate, Core Web Vitals under realistic networks, and a full accessibility audit have not been verified.
- No deployment, publication, external contact integration, or paid service was created. The CTA replays the study rather than using an invented contact address.
- The logo is fictional typography, without a registered-trademark claim. Car copy describes design intent, not real vehicle specifications.
