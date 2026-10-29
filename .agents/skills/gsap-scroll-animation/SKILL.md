---
name: gsap-scroll-animation
description: Plan or implement requested GSAP and scroll-driven animation with accessible fallbacks, scoped lifecycle cleanup, and responsive performance checks. Use for scroll choreography or GSAP work.
---

# GSAP scroll animation

## Activation rules

Apply when explicitly invoked or when requested motion includes GSAP, ScrollTrigger, pinned sequences, or scroll-linked choreography. Do not add scroll effects to a static design merely because this skill exists. A motion plan does not authorize installation or code changes.

## Instructions

1. Read `AGENTS.md`, inspect references and existing animation code, and identify the exact requested elements and behavior. Preserve the current framework and scrolling model. Check the installed GSAP version and available APIs before using examples.
2. Describe each animation's trigger, start/end positions, duration or scrub relationship, easing, pin behavior, and mobile/reduced-motion variant. Use references for timing and visual intent; do not invent unrelated scenes or effects.
3. Reuse installed tooling. If GSAP is absent, determine whether the requested task authorizes adding it; do not install dependencies for planning. Verify applicable licensing and avoid paid services or plugins requiring purchase.
4. For authorized implementation, scope selectors and timelines to the component. Use the framework's supported mount/unmount lifecycle and GSAP context or equivalent cleanup. Revert owned triggers, inline styles, listeners, and timelines on teardown; never kill unrelated animations globally.
5. Prefer transform and opacity animation. Use responsive media queries, including `prefers-reduced-motion`, and keep essential content visible without animation. Reduced motion should remove scrub/pinning and present a readable static sequence where appropriate.
6. Use native scrolling by default. Do not hijack wheel/touch input or add smooth-scroll dependencies without a request. Refresh measurements after relevant fonts/assets/layout settle; avoid refresh loops and per-frame layout reads. Account for pin spacing and breakpoint changes.

## Quality checks

- Exercise forward/reverse scroll, reload midway down the page, resize, and route unmount/remount; verify no duplicate triggers or stale styles.
- Inspect mobile and desktop trigger positions, pin boundaries, overlapping content, and page length.
- Verify reduced motion, keyboard navigation, touch scrolling, and access to all content without animation.
- Check the browser console and profile representative scrolling for layout thrashing and long frames. Record observed results and device/viewport; do not promise a frame rate without measuring.
- Run applicable existing checks and perform the visual audit. If browser tooling is unavailable, mark scroll behavior unverified.
