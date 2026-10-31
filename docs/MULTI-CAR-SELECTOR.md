# Three-car selector — implementation draft

## Authorized scope and reference lock

The user approved Pagani Huayra, Porsche 911 GT3 RS, and Lamborghini Revuelto in the existing dark NOCTURNE studio, with a compact lower-center selector. Keep scroll position when switching, retain the outgoing car until the incoming download finishes, fade via studio lighting, and provide five individual camera poses for each inspected model. Preserve high-detail geometry and authored textures. The existing black/red type and control system owns this selector's visual language. No new routes, libraries, services, sound, configuration panels, or scenes.

## Implemented

- `CarSelector`: previous/next and named buttons, active state, loading/error feedback, keyboard arrows and focus styling. It is hidden until at least two verified cars exist.
- `carCatalog`: separates the three real candidates from verified, selectable assets. There are no fake model paths. The legacy car stays until the three replacements are actually registered.
- The current car stays in the R3F scene during the next download. A light fade commits the replacement; a failed request retains the previous vehicle. Late requests cannot replace a newer selection.
- A shared story playhead samples the active car's five poses without rebuilding ScrollTrigger or resetting scrolling. Matching image views and credits follow the committed car.
- Normalize imported instances with exact vertex bounds, keep their full mesh/texture detail, and dispose owned geometry, materials, and textures exactly once.

## Assets still required

No replacement car files have been downloaded or integrated. The official Sketchfab download button requires sign-in. The secure sign-in prompt selected Google, but automatic approval review rejected observation of `accounts.google.com` because it did not find direct authorization for that provider in the trusted transcript. No alternate login, model ripping, or authentication bypass was attempted. The missing action is explicit authorization for Google sign-in, then the normal secure authentication flow.

Candidate sources:

- Pagani Huayra / Black Snow: https://sketchfab.com/3d-models/pagani-huayra-free-c2d61a9f53a54a229547bb76e4b71e25 — listing shows CC BY.
- Porsche GT3 RS / musiss: https://sketchfab.com/3d-models/porsche-911-gt3-rs-73a595bff7d5498fa1891c4a78787d26 — listing shows CC BY.
- Lamborghini Revuelto / Outlaw Games: https://sketchfab.com/3d-models/lamborghini-revuelto-4258ff5b559c45f2a470344f0e04c8cd — original listing shows CC BY-NC. This repository is a personal, non-commercial demo; retain the actual author and license after intake.

Before registering each car, inspect the actual GLB, source rights, geometry, maps, named parts, orientation, dimensions, and close-up material quality. Supply five matching still-image slots (the hero may repeat in slot five), five inspected camera poses, and local attribution. Self-host any required glTF decoder from existing permitted tooling when the actual asset requires one. Preserve all existing asset/license notices until replacement is complete.

## Validation and delivery status

Five Node tests exercise out-of-order downloads, cancellation and failure, exact grounding without mesh simplification, one-time disposal of shared resources, and deterministic per-car camera sampling at the same playhead. Lint, TypeScript, and the static Pages build are required before source handoff. No multi-car browser or GPU validation is claimed: the replacement assets are absent and the current cloud browser has no WebGL2.

This draft is source-only. It is not deployed, does not expose unavailable car choices, and does not remove the currently working model. Resume by obtaining the files, verifying and registering the three actual models, testing true 3D switches in all chapters, and only then publishing the requested three-car experience.
