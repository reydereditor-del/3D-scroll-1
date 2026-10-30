# Free NOCTURNE previews

The GitHub Pages address is **https://reydereditor-del.github.io/3D-scroll-1/**. The source stays on `feat/nocturne-cinematic-studio`; `gh-pages` contains only generated static files. Publishing this preview does not merge the implementation into `main`.

The public site was checked in a real 1440px desktop browser, including visible forward/reverse 3D camera movement. See [actual screenshots and verification results](PAGES-VALIDATION.md).

## View the experience

Open the URL in a desktop browser with a viewport at least 1024px wide. With reduced motion off and WebGL available, wait for **LIVE 3D EXPERIENCE**, then scroll in both directions or use the chapter controls. Mobile and reduced-motion settings intentionally show the accessible image edition without downloading the 3D model. No software installation, account, API key or subscription is needed to view the site.

## Update the same preview

Use the existing implementation checkout with Node.js 24, npm and Git access to this repository:

```sh
npm ci
npm run lint
npm run typecheck
npm run build:pages
```

Verify the exported site in a browser under `/3D-scroll-1/`, commit the reviewed source changes on the implementation branch, and publish:

```sh
npm run deploy:pages
```

This rebuilds `out/` and pushes a new artifact commit to `gh-pages`. It uses a temporary Git index, keeps the source checkout on its existing branch, and never force-pushes or merges `main`. GitHub Pages must be configured in **Settings → Pages → Deploy from a branch → gh-pages → / (root)**. Wait for its deployment to finish before checking the public URL; the CLI push alone does not establish that the site is live.

Next.js's supported static export keeps the existing React, GSAP and Three.js experience. The Pages build sets `NEXT_PUBLIC_BASE_PATH=/3D-scroll-1`; both public assets and Next's bundles use that prefix. `.nojekyll` keeps `_next` available. Regular `npm run build` and `npm start` retain root-path server hosting. No application dependency was added.

Keep the on-page Asset Credits, debranded model/stills, vehicle license and font licenses. See [asset provenance](ASSET-PROVENANCE.md).

## Optional Vercel preview

Vercel's temporary anonymous deployment was also tested. Its link expires after about one hour and is unsuitable as a saved permanent address. Ownership/authentication details stay in ignored local CLI state and are never committed.

For an account-owned Vercel preview, use a personal Hobby account for personal, non-commercial testing. Do not purchase a domain, enable paid services or upgrade a plan. Run the CLI from the implementation branch, choose the personal Hobby scope, use the detected Next.js settings and avoid `--prod`. No environment variables are required for root-path Vercel hosting. A device-login URL expiring or failing does not establish successful authentication; verify the CLI reports signed in before deploying.

## Verify a deployment

- Confirm HTML, the GLB and licenses return HTTP 200. The GLB must match the committed 5,365,376-byte debranded model.
- At 1440px, check visible WebGL output and actual camera changes during forward and reverse scrolling; also use native wheel input.
- Check all five sections, fonts, vehicle stills and Asset Credits.
- Check mobile and reduced motion in fresh browser contexts: readable image edition, no pinned stage and no GLB request.
- Inspect browser errors and capture actual screenshots of the public URL. Build success alone is insufficient.
