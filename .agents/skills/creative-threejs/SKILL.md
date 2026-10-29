---
name: creative-threejs
description: Plan or implement requested Three.js or real-time web 3D using reference-led composition, existing stack conventions, accessible fallbacks, and measured rendering performance.
---

# Creative Three.js

## Activation rules

Apply when explicitly invoked or when the brief calls for Three.js, WebGL scenes, interactive 3D, or a 3D asset treatment. Do not introduce a canvas into a conventional page without a request. Planning alone does not authorize building a scene.

## Instructions

1. Read `AGENTS.md` and inspect the brief, visual references, installed rendering libraries, asset pipeline, and framework. Preserve an existing renderer or framework integration; do not add React Three Fiber or replace the stack by default.
2. Define the requested composition: subject, camera, scale, lighting, materials, background, and interactions. Tie decisions to references and page content. Do not invent extra scenes, controls, configurators, or effects.
3. Reuse permitted assets and installed dependencies. Check model/texture licenses and file sizes. Never purchase assets, install paid services, or require external accounts. If a required asset is missing, identify it rather than silently substituting a different concept.
4. For authorized implementation, keep semantic page content and controls in accessible DOM. Provide a useful static fallback when WebGL is unavailable or initialization fails. Decorative canvas must not capture focus or intercept scrolling.
5. Size the renderer from its container and update camera projection on resize. Bound pixel ratio and scene complexity for the intended devices; choose initial budgets and measure before adding effects. Use appropriate color management and texture color spaces for the installed Three.js version.
6. Avoid unnecessary continuous rendering for static scenes. Pause work when offscreen or hidden, respect reduced motion, and offer static presentation for nonessential movement. Do not load heavyweight assets before they are needed.
7. On teardown, cancel owned animation frames, disconnect observers, remove listeners, and dispose owned geometries, materials, textures, render targets, and renderer resources. Do not dispose shared resources still in use elsewhere.

## Quality checks

- Compare camera framing, lighting, materials, silhouette, and DOM/canvas alignment to references across mobile and desktop.
- Test resize, high-density displays, reduced motion, unavailable WebGL, loading failure, and repeated mount/unmount.
- Verify keyboard and touch access to requested controls; all essential information must remain available outside the canvas.
- Inspect console output and measure load cost, frame timing, draw calls, and resource growth where tooling permits. State device and conditions; distinguish measured results from estimates.
- Run existing relevant checks and the visual audit. Report unsupported browser/device testing honestly.
