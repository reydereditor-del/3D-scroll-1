# Cinematic scroll update

## Reference lock

Primary target: the existing public NOCTURNE GitHub Pages site, inspected on 2026-10-30. Preserve near-black studio, graphite car, red accents, Manrope/Instrument Serif type, chapter rail, exact copy, and five sections. The observed browser selected the WebGL fallback.

Cinematic Scroll supplies reversible transitions and scene holds; Refero's bundled motion guide supplies continuity, hierarchy, transform/opacity animation, and reduced-motion restraint. Live Refero search was unavailable (subscription required). No new visual assets or dependencies.

## Decision ledger

- Keep the existing real-time 3D camera and lighting: preserve the original medium and composition.
- Animate the fallback stills with the same timeline: replace abrupt source changes with scroll-controlled crossfades and restrained push-ins.
- Mount all five timeline frames (four unique images): let upcoming views load before transitions and support reverse scrubbing.
- Darken the text side of the studio; fade in a right-side shade for Performance: improve readability without changing typography or artwork.
- Use subtle image motion on mobile only when normal motion is requested; retain the normal-flow reduced-motion edition.

## Timeline

The existing 5.4-unit story and 5.5-viewport scroll range are retained. Hero holds to 0.45; transitions start at 0.45, 1.8, and 3.25. Text enters after each camera move. Still-image transitions fade over 0.5 units, with a longer 1.45-unit camera-like drift. At 4.6 the opening view returns; at 5.4 the existing final section follows.

## Assets

The existing hero, design, performance, and details WebP images remain unchanged. They are full-frame studio renders, not transparent depth cutouts; the fallback is an animated image sequence, not a substitute claim of real 3D. The existing GLB continues to provide true 3D where WebGL is available. Existing license and credit files remain intact.
