# Dark studio review

## Approved direction

The user selected a dark premium studio after discussing Spyker C8 Preliator and BMW F3. Preserve NOCTURNE's existing copy, graphite/red palette, typefaces, five sections, stack, and debranded licensed asset. No tunnel, road environment, sound, start gate, new pages, or dependencies are added.

Reference observations were limited: Spyker's visual loader stalled at 92%; BMW F3's main visual media did not fully display in the available browser. Their page structures and controls were inspected. The direction is an original studio implementation, not a fidelity claim about their camera animation.

## Reference lock and decisions

- Existing NOCTURNE owns palette, type, content, and structure.
- The user's approved studio concept owns camera choreography, lighting reveal, deliberate pauses, close detail framing, and restrained reflection.
- Cinematic Scroll supplies deterministic reverse scrubbing and scene enter/hold/exit timing.
- Existing Refero motion guidance supplies continuity and reduced-motion restraint; live research required an unavailable subscription.
- Smaller desktop type reserves the left third for copy and the right side for the car. Performance reverses this placement.

## Actual 3D changes

The GLB's lowest actual vertex was 0.175214 above the floor. Normalize the loaded instance with precise world-space vertex bounds so the tires contact zero. The underlying licensed GLB is unchanged.

Use graphite physical paint with a clearcoat, distinct smoked glazing and alloy roughness, and emissive front/rear lenses. Narrow authored studio softboxes produce controlled highlights. A demand-rendered planar reflection uses a maximum 768 by 512 target, no MSAA, a five-sample softening filter, and a spatial fade. A contact shadow anchors the vehicle; no postprocessing chain is added.

`lib/studioDirection.ts` owns the five camera poses and timing. The 7.4-unit story uses native scrolling over seven viewport heights. Camera travel starts at 0.65, 2.45, and 4.35, followed by text holds. The last 1.1 units pull out to the full vehicle.

## Checks and limits

Lint, TypeScript, static Pages build, and asset provenance checks passed. The model was loaded with Three.js outside the browser to check exact vertex bounds and projected camera framing. Hero and Design bounding-box projections fit the viewport; Performance has an intentional edge crop and Details intentionally uses a close crop. Camera radius remains outside the vehicle throughout each polar transition.

The available cloud browser has no WebGL2. Actual paint, reflection shader output, lighting, real-time camera motion, and GPU cost cannot be visually certified in this environment. The live browser check covers only the image fallback, desktop composition, timeline, controls, and console. This remains a studio review version until the live 3D has been visually checked on a WebGL-capable device. Mobile/reduced-motion browser emulation is also unavailable; existing normal-flow variants are retained.
