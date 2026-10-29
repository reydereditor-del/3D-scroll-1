---
name: visual-quality-audit
description: Audit rendered web UI against the brief and visual references for fidelity, responsive behavior, accessibility, motion, and performance. Use for visual review or delivery verification.
---

# Visual quality audit

## Activation rules

Apply when explicitly invoked, when the user requests visual review, or before delivering authorized UI changes under this repository's workflow. An audit-only request permits inspection and findings; do not redesign or fix files unless requested or already within an implementation task.

## Instructions

1. Read `AGENTS.md`, the brief, references, and changed files. Identify acceptance criteria and the application's actual documented startup and validation commands. If no application exists, audit the available guidance and clearly state that rendered validation is unavailable.
2. Run the app using existing tooling when applicable. Inspect real browser output, not only source code. Capture the tested route, viewport, state, and evidence location. If browser tools or references are unavailable, report the limitation and continue checks that are possible.
3. Compare reference and implementation at matching viewport sizes. Review hierarchy, typography, spacing, alignment, imagery, color, composition, and requested content. Separate defects from subjective preferences; tie every finding to evidence or a stated criterion.
4. Inspect representative mobile (about 390px), tablet (about 768px), and desktop (about 1440px) widths, plus affected breakpoints. Exercise relevant hover/focus, navigation, loading, error, and empty states only when present in the product. Check overflow, clipping, stacking, image crops, and text wrapping.
5. Test keyboard order and visible focus, accessible control names, heading structure, contrast, zoom/reflow, reduced motion, and touch behavior. Automated tools supplement manual checks; do not claim full accessibility conformance from a scanner alone.
6. For animated or 3D interfaces, test scrolling in both directions, resize, lifecycle cleanup, and static fallbacks. Inspect console errors, asset failures, layout shifts, and representative runtime performance. Run relevant existing build/type/lint/test checks without conflating them with visual acceptance.
7. In an authorized implementation task, fix in-scope defects and recheck affected states. In audit-only mode, provide actionable findings without edits. Do not add unrequested features in response to aesthetic preferences.

## Quality checks and report

- Rank findings by impact: blocker (essential workflow unusable), major (material brief/accessibility/responsive defect), minor (localized polish).
- For each finding, include route/state, viewport, expected versus observed behavior, evidence, and a focused recommendation.
- Report checks as passed, failed, or unverified with reasons. Include remaining risks and deliberate deviations from references.
- If no defects are found, state the inspected scope and limits rather than declaring perfection.
- Deliver a concise report: overall result, findings, changes if authorized, checks executed, and unresolved limitations. Never fabricate screenshots, measurements, test results, or reference access.
