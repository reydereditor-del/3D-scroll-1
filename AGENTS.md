# Repository workflow

## Scope and current state

This repository contains the authorized NOCTURNE automotive demo: Next.js, TypeScript, Tailwind CSS, GSAP ScrollTrigger, Three.js and React Three Fiber. Use npm and the checked-in lockfile. Preserve the five-section scope. See README.md for commands and docs/ASSET-PROVENANCE.md before changing vehicle assets.

For every task, inspect the current files, nested agent instructions, manifests, lockfiles, scripts, and user brief before making changes. Preserve the stack once established; use its package manager, component patterns, styling conventions, and documented commands. Do not replace frameworks or introduce dependencies merely to follow these skills. If implementation is requested while the repository is still empty, resolve the intended stack before scaffolding.

Use the existing checkout; cloud tasks are already isolated. Do not create Git worktrees unless the user requests one. Preserve unrelated changes. Do not install paid services, purchase assets, or require subscriptions.

## Brief and visual references

Identify the requested pages, content, interactions, assets, constraints, and acceptance criteria. Treat those as the scope boundary. Never add unrequested sections, routes, features, integrations, invented claims, or decorative interactions. Creativity belongs within the brief.

Inspect supplied screenshots, URLs, or design files using available tools before interpreting them. Record the source and concrete observations about composition, typography, spacing, color, imagery, and motion. Extract principles rather than copying branding or unlicensed assets. If references are inaccessible, say so; request the necessary reference or state a limited assumption without claiming visual fidelity. Reference-led implementation requires a usable reference; planning and inspection can continue while it is missing.

## Skill routing

Read the relevant `.agents/skills/<name>/SKILL.md` when explicitly invoked or when its activation rules match the task:

- `premium-web-design`: visual direction, layout, typography, responsive UI.
- `gsap-scroll-animation`: requested GSAP or scroll-driven choreography.
- `creative-threejs`: requested real-time 3D or Three.js work.
- `visual-quality-audit`: visual review and acceptance checks.

Use only relevant skills. Naming GSAP or Three.js here does not authorize installing either library. User instructions take precedence over repository defaults. Announce which skills apply briefly. Explicit invocation can use `$premium-web-design` or the skill's file path if skill discovery is unavailable.

## Delivery sequence

1. Inspect the brief, repository, and references. State the intended result and any material assumption.
2. For implementation tasks, establish a small visual system and implement the requested scope using existing tools. For planning or audit tasks, produce only the requested guidance or findings.
3. Keep semantic content usable without animation or WebGL. Respect reduced motion, keyboard input, touch input, contrast, and responsive layouts.
4. Run existing relevant build, lint, type, and test commands when available. Do not invent commands or count unavailable checks as passed.
5. For UI changes, inspect rendered desktop and mobile views plus relevant interactive states. Use `visual-quality-audit`; fix in-scope regressions and report remaining issues.
6. Report changed files, actual validation, and limitations. Do not claim browser, performance, or accessibility validation without evidence.

Install with `npm ci`, start with `npm run dev`, and validate with `npm run lint`, `npm run typecheck`, and `npm run build`. Use the existing checkout. Do not publish or deploy without authorization.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
