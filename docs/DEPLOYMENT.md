# Personal preview on Vercel Hobby

This preview is authorized for **personal, non-commercial testing only**. Use a personal Hobby account. Do not purchase a domain, enable paid services, upgrade a plan, or deploy this as commercial/client work on Hobby. Stop if Vercel requires a paid plan for the chosen account/repository. See https://vercel.com/docs/plans/hobby.

The application requires no API keys or external services. Do not remove the visible Asset Credits control, `/licenses/carconcept-CC-BY-4.0.txt`, or the debranded model/stills. See [provenance](ASSET-PROVENANCE.md). Never deploy the original branded asset.

## Current repository and branch

- Repository: https://github.com/reydereditor-del/3D-scroll-1
- Preview branch: `preview/nocturne-first-review`
- Base branch: `main`
- PR creation page (not proof that a PR exists): https://github.com/reydereditor-del/3D-scroll-1/compare/main...preview/nocturne-first-review?expand=1

Do not merge solely to obtain a preview. Main initially contains only a README; run the preview from the implementation branch.

## Generate a preview without deploying main

On your own computer, authenticate to your personal Vercel Hobby account. The CLI is invoked temporarily, not added to application dependencies:

```sh
git clone https://github.com/reydereditor-del/3D-scroll-1.git
cd 3D-scroll-1
git switch preview/nocturne-first-review
npm ci
npm run build
npx vercel@latest login
npx vercel@latest deploy
```

In the deployment prompts:

1. Confirm setup/deployment of this directory.
2. Choose your **personal Hobby scope**. Do not select a paid team.
3. Link an existing personal Hobby project if you have one; otherwise create a project such as `nocturne-personal-preview`.
4. Use project directory `./` (the Git checkout root, not `app/`).
5. Use the detected Next.js framework, build command `npm run build`, install command `npm ci`, and default Next.js output settings. Do not set `output: export` or an `out` directory. Node.js 24.x matches the validated local environment; choose it in project settings if necessary.
6. No environment variables are required. Never enter credentials into the repository or commit `.vercel/`.
7. Do **not** add `--prod`. The CLI's normal deployment is a Preview deployment. Check the command's result; copy the actual generated HTTPS deployment URL only after the build is Ready. If prompted to upgrade, cancel.

## Connect GitHub for subsequent automatic previews

1. In Vercel, open the newly linked project and go to **Settings → Git → Connect Git Repository**.
2. Choose GitHub, authorize/install the Vercel GitHub integration for `reydereditor-del/3D-scroll-1` only, then connect that repository. GitHub may require its owner to approve access.
3. Keep the Production Branch as `main`. The implementation remains on `preview/nocturne-first-review`; do not promote it to Production.
4. With Git connected, pushes to non-production branches/PRs should create Preview deployments. Check **Deployments** for the branch and commit; the preview created by the CLI already provides the first test URL without another source change.
5. A protected preview may require Vercel login. Test while signed in; share access only through Vercel's supported Hobby controls. Do not upgrade to obtain sharing features.

If a PR was not opened automatically by the agent, open the compare link above, choose base `main`, confirm the implementation branch, and create the PR. A prepared description is available in [PR-BODY.md](PR-BODY.md).

## Verify the actual deployment

After Vercel reports Ready:

- Open the actual HTTPS URL and confirm exactly five sections and visible Asset Credits in the final CTA.
- At desktop width ≥1024px with reduced motion off, wait for **LIVE 3D EXPERIENCE**. In browser Network tools, verify `/models/concept.glb` returns 200 and transfers the debranded 5,365,376-byte asset. Confirm `/licenses/carconcept-CC-BY-4.0.txt` returns the license text.
- Scroll forward and backward and use the chapter controls. Camera position/target and chapter text must change together without duplicate text, pin jumps, or visible restricted logos.
- Reload midway through the story and resize to mobile. On mobile and reduced motion, verify all text/posters remain readable and no GLB is requested on a fresh load.
- Check the console and network panel for errors. Test model-load failure if practical; the studio poster should remain usable.

No online deployment URL is recorded here because none has been created or verified in the agent environment. A local browser screenshot is not proof of an online deployment.
