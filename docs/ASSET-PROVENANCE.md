# Vehicle provenance and modifications

## Source and rights

- Asset: **Car Concept**, Eric Chadwick, © 2024 Darmstadt Graphics Group GmbH.
- Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept
- Asset-specific metadata: https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/CarConcept/metadata.json
- Model and textures: **CC BY 4.0**, https://creativecommons.org/licenses/by/4.0/
- Local full license, including warranty disclaimer: `public/licenses/carconcept-CC-BY-4.0.txt`.
- The license permits commercial use, modification and redistribution, including downloadable web assets, with attribution and change notices. No endorsement is implied.
- The source has separately controlled Khronos / 3D Commerce marks. Their rights are not granted by CC BY. We do not rely on permission to use those marks.

Metadata and license texts were retrieved and checked before downloading the original. The original GLB was kept in a temporary directory outside the repository/public tree. Its reported size was 11,778,688 bytes.

## Derivative preparation

`scripts/prepare-car.py` is the reproducible Blender preparation script; it takes a separately verified local source file and does no downloading.

1. Remove the dedicated `License Plate` and `InteriorSteeringEmblem` objects.
2. Replace **every** material with newly authored untextured materials, including plain alloy/rubber. Original image textures, decals and texture-based branding are not used.
3. Clear imported glTF material-variant bindings and default-material mappings, which can otherwise restore the source materials during export.
4. Reset polygon material indices to the new sole material slot.
5. Normalize bounds to a 4.8-unit vehicle length; preserve body geometry and source hierarchy.
6. Export only the vehicle; create a separate studio setup to render matching fallback WebP images. No source HDRI or third-party studio imagery is used.
7. Optimize the derivative using glTF Transform: weld/deduplicate, join meshes and prune unused data. Final delivery preserves floating-point attributes without lossy simplification or quantization. No network decoder service is used.

The model license and attribution remain applicable to this derivative and the rendered stills. Credits are accessible within the final CTA section. No extra page section was added.

## Inspection

The exported GLB must contain no images, textures, material variants, or named license/emblem meshes. Exterior front, side and rear renders and the final browser experience are checked for residual visible marks. Future asset replacement requires repeating this inspection. Never copy the original GLB into `public/`.

## Dependencies

Next.js, React, React Three Fiber, Three.js and Tailwind are used under their distributed free software licenses; exact versions are recorded in `package-lock.json`. GSAP's installed README expressly permits free commercial use under its Standard No Charge license (https://gsap.com/standard-license). Only core GSAP and ScrollTrigger are used. GSAP is not described as MIT-licensed. No paid APIs, services, fonts, environments or processing tools are required.

The live renderer additionally tunes the replacement graphite material to a darker satin finish and softens alloy roughness. Studio posters are matching views of the same unbranded geometry, with a separately rendered studio lighting setup. Final GLB size: **5,365,376 bytes**.
