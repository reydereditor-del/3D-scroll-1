# NOCTURNE — an automotive design study

A fictional, unbranded portfolio demo with exactly five sections: Hero, Design, Performance, Details and Final CTA. Built with Next.js, TypeScript, Tailwind CSS, GSAP ScrollTrigger, Three.js and React Three Fiber.

Live preview: https://reydereditor-del.github.io/3D-scroll-1/ — see [viewing and deployment instructions](docs/DEPLOYMENT.md).

## Run

Requires Node.js 20.9+ (validated here with Node 24) and npm.

```sh
npm ci
npm run dev
```

Open the local server on port 3000 in your browser. For production:

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

The scripts use Next.js's supported webpack mode because this cloud environment blocked Turbopack's internal PostCSS worker port. No external API keys or services are needed.

## Experience

On desktop at 1024px and wider, one pinned stage and one GSAP master timeline coordinate an orbital camera, moving studio light, and masked chapter text. A short lighting reveal opens the scene; composed holds separate the side, rear, and close detail views. The chapter rail follows scroll progress, and its controls land on each completed composition. The final CTA returns to the opening view. The canvas renders on demand. See [cinematic studio notes and browser regression instructions](docs/CINEMATIC-STUDIO.md).

Mobile and reduced-motion defaults use matching pre-rendered vehicle stills and normal document flow, without requesting the GLB. Mobile has light text reveals; reduced motion keeps presentation static. On desktop, the header explains when reduced motion is active and offers **Enable 3D & motion** as an explicit opt-in for this session. **Use device settings** restores the default. See the [motion-preference fix and browser checks](docs/MOTION-PREFERENCE-FIX.md). Manrope and Instrument Serif are locally hosted under SIL OFL 1.1; font source and licenses are documented in the cinematic studio notes. Asset/loading/WebGL failure leaves a studio poster visible; text remains independent of WebGL. The scene has capped pixel ratio, no realtime shadows, no postprocessing and no external environment download.

## Vehicle rights

See [asset provenance](docs/ASSET-PROVENANCE.md) for source, CC BY 4.0 attribution, trademark removal, and modifications. The public asset is the debranded derivative, not the original. The original is not committed. Reproduction instructions:

```sh
blender -b --python scripts/prepare-car.py -- /path/to/verified-original.glb
```

Then optimize using the glTF Transform CLI (optional offline development tooling; not an application dependency):

```sh
gltf-transform optimize public/models/concept.glb /tmp/concept-optimized.glb --compress false --palette false --texture-compress false --simplify false
```

Copy the optimized result over `public/models/concept.glb` only after checking its output. Preparation requires Blender; regular development uses the committed optimized model and posters.

## References and validation

The supplied Dogstudio/Zoox, Scout Motors and Scrollytelling URLs were attempted, but the environment proxy denied access. No reference screenshots were inspected and no fidelity claim is made. The approved near-black/red/editorial direction guides this original composition.

See [validation notes](docs/VALIDATION.md) for actual checks, limitations, and asset sizes. See `AGENTS.md` and `.agents/skills/` for repository workflow guidance.

## Personal online preview

See [deployment instructions](docs/DEPLOYMENT.md) for a Vercel Hobby **personal, non-commercial** preview from the implementation branch. No paid plan, production promotion, or commercial hosting is authorized by that workflow.
