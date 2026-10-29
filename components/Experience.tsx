'use client';
/* Studio stills use the same debranded asset as the live scene. */
/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic';
import { Component, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { StudioState } from './VehicleScene';

const VehicleScene = dynamic(() => import('./VehicleScene'), { ssr: false });
const chapters = ['Hero', 'Design', 'Performance', 'Details'];
// Navigation lands in the composed hold, after the camera/text transition.
const chapterTimes = [0, 1.5, 2.9, 4.45];
const storyDuration = 5.4;
const poses: Omit<StudioState, 'opening'>[] = [
  { angle: .68, radius: 10, height: 2.45, tx: 0, ty: .6, tz: 0, offset: -.19, key: .8, rim: .7, sweep: -.3 },
  { angle: 1.55, radius: 12.2, height: 1.9, tx: 0, ty: .6, tz: 0, offset: -.14, key: 1, rim: .5, sweep: .7 },
  { angle: 3.88, radius: 10.5, height: 2.05, tx: 0, ty: .6, tz: 0, offset: .19, key: .75, rim: 1, sweep: .2 },
  { angle: 6.93, radius: 6.2, height: 1.35, tx: .35, ty: .6, tz: 1, offset: -.23, key: 1.15, rim: .35, sweep: .8 },
  { angle: 6.96, radius: 9.4, height: 2.45, tx: 0, ty: .6, tz: 0, offset: -.05, key: .8, rim: .7, sweep: -.3 },
];

function Arrow({ down = false }: { down?: boolean }) {
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: down ? 'rotate(135deg)' : undefined }}><path d="M3 13 13 3M3 3h10v10" stroke="currentColor" strokeWidth="1.15" /></svg>;
}
function Line({ children }: { children: ReactNode }) {
  return <span className="reveal-line"><span>{children}</span></span>;
}
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Experience() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [studio] = useState<StudioState>(() => ({ ...poses[0], opening: .16 }));
  const draw = useRef(() => {});
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const [live, setLive] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [assetFailed, setAssetFailed] = useState(false);
  const register = useCallback((update: () => void) => { draw.current = update; }, []);
  const onReady = useCallback(() => { setStatus('ready'); }, []);
  const onError = useCallback(() => { setStatus('fallback'); setAssetFailed(true); }, []);

  useEffect(() => {
    if (!live || status !== 'ready') return;
    const reveal = gsap.to(studio, { opening: 1, duration: 1.65, ease: 'power2.out', onUpdate: () => draw.current() });
    return () => { reveal.kill(); };
  }, [live, status, studio]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let restoreTop: number | null = null;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    try {
      const saved = JSON.parse(sessionStorage.getItem('nocturne-scroll') || 'null');
      if (navigation?.type === 'reload' && saved?.width === window.innerWidth) restoreTop = saved.y;
    } catch { /* Native restoration remains available when storage is blocked. */ }
    const remember = () => {
      try { sessionStorage.setItem('nocturne-scroll', JSON.stringify({ y: window.scrollY, width: window.innerWidth })); } catch { /* Private mode. */ }
    };
    window.addEventListener('pagehide', remember);
    const media = gsap.matchMedia(root);

    media.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      let disposed = false;
      let refreshFrame = 0;
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      const supported = !!gl;
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      setAssetFailed(false);
      setStatus(supported ? 'loading' : 'fallback');
      setLive(supported);
      gsap.set(studio, { ...poses[0], opening: .16 });
      const panels = gsap.utils.toArray<HTMLElement>('.chapter', root.current);
      gsap.set(panels, { autoAlpha: 0, y: 0 });
      gsap.set(panels[0], { autoAlpha: 1 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: stage.current, start: 'top top', end: () => '+=' + window.innerHeight * 5.5,
          pin: true, scrub: .35, invalidateOnRefresh: true,
        },
        onUpdate: () => {
          const time = timeline.time();
          // The rail follows the visible scene, including the softened scrub.
          root.current?.style.setProperty('--story-progress', String(timeline.progress()));
          setActive(time >= 3.85 ? 3 : time >= 2.35 ? 2 : time >= .98 ? 1 : 0);
        },
      });
      trigger.current = timeline.scrollTrigger!;
      chapterTimes.forEach((time, index) => timeline.addLabel(chapters[index].toLowerCase(), time));
      const starts = [.45, 1.8, 3.25];
      const durations = [.75, .8, .85];
      starts.forEach((start, index) => {
        timeline.to(studio, { ...poses[index + 1], duration: durations[index], ease: 'sine.inOut', onUpdate: () => draw.current() }, start);
        timeline.to(panels[index], { autoAlpha: 0, y: -20, duration: .22, ease: 'power2.in' }, start + .3);
        timeline.fromTo(panels[index + 1], { autoAlpha: 0, y: 0 }, { autoAlpha: 1, duration: .3 }, start + durations[index] - .22);
        timeline.fromTo(panels[index + 1].querySelectorAll('.reveal-line > span'), { yPercent: 110 }, { yPercent: 0, duration: .4, stagger: .07, ease: 'power3.out' }, start + durations[index] - .22);
        timeline.fromTo(panels[index + 1].querySelectorAll('.chapter-note'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .25 }, start + durations[index] + .05);
      });
      timeline.to(studio, { ...poses[4], duration: .8, ease: 'sine.inOut', onUpdate: () => draw.current() }, storyDuration - .8);
      timeline.to(panels[3], { autoAlpha: 0, y: -12, duration: .3 }, storyDuration - .3);

      // A short entrance, independent of model download time. No blocking loader.
      gsap.from('.site-header', { opacity: 0, y: -8, duration: .8, ease: 'power2.out' });
      gsap.fromTo('.hero .reveal-line > span', { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: .12, ease: 'power3.out', delay: .12 });
      gsap.from('.hero .eyebrow, .hero-bottom', { opacity: 0, y: 12, duration: .9, stagger: .15, delay: .25 });

      gsap.fromTo('.final-section > img', { yPercent: -6, scale: 1.1 }, {
        yPercent: 6, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.final-section', start: 'top bottom', end: 'bottom top', scrub: .8 },
      });
      gsap.from('.final-content .reveal-line > span', {
        yPercent: 110, duration: 1, stagger: .12, ease: 'power3.out',
        scrollTrigger: { trigger: '.final-section', start: 'top 65%', toggleActions: 'play none none reverse' },
      });
      document.fonts.ready.then(() => {
        if (disposed) return;
        refreshFrame = requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          if (restoreTop !== null) {
            window.scrollTo(0, restoreTop);
            restoreTop = null;
            ScrollTrigger.update();
          }
        });
      });
      return () => {
        disposed = true;
        cancelAnimationFrame(refreshFrame);
        trigger.current = null;
        root.current?.style.removeProperty('--story-progress');
        setLive(false);
      };
    });

    media.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
      // Mobile retains the light, static image edition. Only DOM text reveals.
      for (const panel of gsap.utils.toArray<HTMLElement>('.chapter, .final-section', root.current)) {
        gsap.from(panel.querySelectorAll('.reveal-line > span'), {
          yPercent: 110, duration: .85, stagger: .08, ease: 'power3.out',
          scrollTrigger: { trigger: panel, start: 'top 82%', once: true },
        });
      }
    });
    return () => { window.removeEventListener('pagehide', remember); media.revert(); };
  }, [studio]);

  const go = (index: number) => {
    const current = trigger.current;
    if (current) {
      window.scrollTo({ top: current.start + chapterTimes[index] / storyDuration * (current.end - current.start), behavior: 'auto' });
    } else document.getElementById(chapters[index].toLowerCase())?.scrollIntoView({ behavior: 'auto' });
  };

  return <main ref={root} id="top" data-chapter={chapters[active].toLowerCase()}>
    <a href="#hero" className="skip-link">Skip to the concept</a>
    <header className="site-header">
      <a href="#top" aria-label="Nocturne — back to top" className="wordmark">N<span className="mark-slash">/</span> NOCTURNE</a>
      <div className="header-center">INDEPENDENT DESIGN STUDY <span>—</span> 001</div>
      <a href="#final" className="header-link">THE CONCEPT <span><Arrow /></span></a>
    </header>
    <div ref={stage} className={`experience-stage ${live ? 'is-live' : ''}`}>
      <div role="img" aria-label={`Unbranded graphite concept car — ${chapters[active]} studio view`} className={`scene-layer ${status === 'ready' ? 'scene-ready' : ''}`}>
        <img className="scene-poster" src={`/images/${['hero', 'design', 'performance', 'details'][active]}.webp`} alt="" fetchPriority="high" />
        {live && !assetFailed && <SceneBoundary onError={onError}><VehicleScene state={studio} register={register} onReady={onReady} onError={onError} /></SceneBoundary>}
      </div>
      <div className="stage-vignette" />
      <div className="chapter-grid">
        <section id="hero" className="chapter hero" aria-labelledby="hero-title">
          <div className="eyebrow"><span className="red-line" /> AUTOMOTIVE EXPLORATION — VOL. 01</div>
          <h1 id="hero-title"><Line>A study</Line><Line>in <em>motion.</em></Line></h1>
          <div className="hero-bottom"><p>Not built to blend in.<br />An exploration of form, light, and presence.</p><button onClick={() => go(1)} className="text-link">EXPLORE THE CONCEPT <span><Arrow down /></span></button></div>
          <img className="mobile-car" src="/images/hero.webp" alt="Unbranded graphite concept car, front three-quarter studio view" fetchPriority="high" />
        </section>
        <section id="design" className="chapter editorial design" aria-labelledby="design-title">
          <div className="eyebrow"><span className="red-line" /> 01 / DESIGN</div>
          <h2 id="design-title"><Line>Less noise.</Line><Line><em>More presence.</em></Line></h2>
          <p>A continuous silhouette. A deliberate line.<br />Nothing added without a reason.</p>
          <div className="chapter-note"><span>FORM LANGUAGE</span><span>SCULPTED / UNBROKEN</span></div>
          <img className="mobile-car" src="/images/design.webp" alt="Side profile of the unbranded concept car" loading="lazy" />
        </section>
        <section id="performance" className="chapter editorial performance" aria-labelledby="performance-title">
          <div className="eyebrow"><span className="red-line" /> 02 / PERFORMANCE</div>
          <h2 id="performance-title"><Line>Motion.</Line><Line><em>Before movement.</em></Line></h2>
          <p>A low stance. A purposeful proportion.<br />The visual expression of energy, held still.</p>
          <div className="chapter-note"><span>A DESIGN EXPLORATION</span><span>NO PERFORMANCE CLAIMS</span></div>
          <img className="mobile-car" src="/images/performance.webp" alt="Low rear three-quarter view of the concept car" loading="lazy" />
        </section>
        <section id="details" className="chapter editorial details" aria-labelledby="details-title">
          <div className="eyebrow"><span className="red-line" /> 03 / DETAILS</div>
          <h2 id="details-title"><Line>The closer</Line><Line><em>you look.</em></Line></h2>
          <p>Graphite surfaces meet a precise edge of light.<br />A quiet dialogue between material and form.</p>
          <div className="chapter-note detail-note"><span>MATERIAL STUDY</span><span>GRAPHITE / LIGHT / SHADOW</span></div>
          <img className="mobile-car" src="/images/details.webp" alt="Close studio framing of the front bodywork and wheel" loading="lazy" />
        </section>
      </div>
      <nav className="chapter-nav" aria-label="Concept chapters">
        <div className="nav-track" aria-hidden="true"><span /></div>
        {chapters.map((name, index) => <button key={name} onClick={() => go(index)} aria-label={`Explore ${name}`} aria-current={active === index ? 'step' : undefined}>
          <span className="nav-label">{name === 'Hero' ? 'INTRO' : name.toUpperCase()}</span><span className="nav-rule" /><span className="nav-number">0{index + 1}</span>
        </button>)}
      </nav>
      <div className="stage-footer">
        <span>FICTIONAL CONCEPT / PORTFOLIO DEMO</span>
        <span className="scene-status" role="status">{live ? (status === 'ready' ? 'LIVE 3D EXPERIENCE' : status === 'fallback' ? 'STUDIO VIEW / 3D UNAVAILABLE' : 'LOADING 3D / STUDIO VIEW') : 'STUDIO EDITION'}</span>
        <span className="scroll-cue">SCROLL TO DISCOVER <span><Arrow down /></span></span>
      </div>
    </div>
    <section id="final" className="final-section" aria-labelledby="final-title">
      <img src="/images/hero.webp" alt="The graphite concept in its studio setting" loading="lazy" />
      <div className="final-content">
        <div className="eyebrow"><span className="red-line" /> THE STUDY CONTINUES</div>
        <h2 id="final-title"><Line>Leave an</Line><Line><em>impression.</em></Line></h2>
        <a href="#top" className="cta"><span>EXPERIENCE IT AGAIN</span><span className="cta-arrow"><Arrow /></span></a>
      </div>
      <footer className="final-footer">
        <span className="wordmark">N<span className="mark-slash">/</span> NOCTURNE</span>
        <p>An independent, fictional automotive study.<br />Not affiliated with a vehicle manufacturer.</p>
        <details className="credits"><summary>ASSET CREDITS +</summary><p>“Car Concept” by Eric Chadwick, © 2024 Darmstadt Graphics Group GmbH. <a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept">Source</a> · <a href="/licenses/carconcept-CC-BY-4.0.txt">CC BY 4.0</a>. Modified: marks and original textures removed; materials replaced; normalized and optimized. No endorsement implied.</p></details>
      </footer>
    </section>
  </main>;
}
