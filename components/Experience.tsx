'use client';
/* Studio stills use the same debranded asset as the live scene. */
/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic';
import { Component, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { StudioState } from './VehicleScene';
import { assetPath } from '@/lib/assetPath';
import { useMotionPreference } from '@/lib/useMotionPreference';
import { studioPoses as poses, chapterTimes, storyDuration, moves } from '@/lib/studioDirection';

const VehicleScene = dynamic(() => import('./VehicleScene'), { ssr: false });
const chapters = ['Hero', 'Design', 'Performance', 'Details'];
const stills = ['hero', 'design', 'performance', 'details', 'hero'];

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
  const { desktop, prefersReducedMotion, motionOverride, toggleMotion } = useMotionPreference();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [studio] = useState<StudioState>(() => ({ ...poses[0], opening: .16 }));
  const draw = useRef(() => {});
  const trigger = useRef<ScrollTrigger | null>(null);
  const restoreOnLoad = useRef(true);
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
      if (restoreOnLoad.current && navigation?.type === 'reload' && saved?.width === window.innerWidth) restoreTop = saved.y;
    } catch { /* Native restoration remains available when storage is blocked. */ }
    const remember = () => {
      try { sessionStorage.setItem('nocturne-scroll', JSON.stringify({ y: window.scrollY, width: window.innerWidth })); } catch { /* Private mode. */ }
    };
    window.addEventListener('pagehide', remember);
    const media = gsap.matchMedia(root);

    // Device preferences remain the default; full motion requires a deliberate
    // site-level opt-in when the device requests reduced motion.
    media.add(`(min-width: 1024px)${motionOverride ? '' : ' and (prefers-reduced-motion: no-preference)'}`, () => {
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
      const posters = gsap.utils.toArray<HTMLElement>('.scene-poster', root.current);
      gsap.set(posters, { opacity: 0, scale: 1.08, xPercent: 0, yPercent: 0 });
      gsap.set(posters[0], { opacity: 1, scale: 1.02 });
      gsap.set(panels, { autoAlpha: 0, y: 0 });
      gsap.set(panels[0], { autoAlpha: 1 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: stage.current, start: 'top top', end: () => '+=' + window.innerHeight * 7,
          pin: true, scrub: .35, invalidateOnRefresh: true,
        },
        onUpdate: () => {
          const time = timeline.time();
          // The rail follows the visible scene, including the softened scrub.
          root.current?.style.setProperty('--story-progress', String(timeline.progress()));
          setActive(time >= moves[2].text ? 3 : time >= moves[1].text ? 2 : time >= moves[0].text ? 1 : 0);
        },
      });
      trigger.current = timeline.scrollTrigger!;
      chapterTimes.forEach((time, index) => timeline.addLabel(chapters[index].toLowerCase(), time));
      // The poster timeline runs independently of WebGL. Keep all frames mounted
      // so the browser can load upcoming views before their transition.
      timeline.to(posters[0], { scale: 1.09, xPercent: 1, duration: 1.6, ease: 'sine.inOut' }, 0);
      moves.forEach(({ start, duration, text }, index) => {
        const incoming = posters[index + 1];
        timeline.to(incoming, { opacity: 1, duration: .5, ease: 'sine.inOut' }, start + .1);
        timeline.to(incoming, { scale: 1.01, xPercent: index === 1 ? -1 : 1, duration: 1.9, ease: 'sine.inOut' }, start);
        timeline.to(posters[index], { opacity: 0, duration: .3 }, start + .5);
        timeline.to('.stage-vignette', { '--shade-right': index === 1 ? 1 : 0, duration: .5, ease: 'sine.inOut' }, start);
        timeline.to(studio, { ...poses[index + 1], duration, ease: 'sine.inOut', onUpdate: () => draw.current() }, start);
        timeline.to(panels[index], { autoAlpha: 0, y: -20, duration: .22, ease: 'power2.in' }, start + .3);
        timeline.fromTo(panels[index + 1], { autoAlpha: 0, y: 0 }, { autoAlpha: 1, duration: .3 }, text);
        timeline.fromTo(panels[index + 1].querySelectorAll('.reveal-line > span'), { yPercent: 110 }, { yPercent: 0, duration: .4, stagger: .07, ease: 'power3.out' }, text);
        timeline.fromTo(panels[index + 1].querySelectorAll('.chapter-note'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .25 }, text + .3);
      });
      timeline.to(studio, { ...poses[4], duration: 1.1, ease: 'sine.inOut', onUpdate: () => draw.current() }, storyDuration - 1.1);
      timeline.to(posters[4], { opacity: 1, scale: 1, duration: 1.1, ease: 'sine.inOut' }, storyDuration - 1.1);
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
          restoreOnLoad.current = false;
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
        const image = panel.querySelector('.mobile-car');
        if (image) gsap.fromTo(image, { scale: 1.06, yPercent: 3 }, {
          scale: 1, yPercent: -3, ease: 'none',
          scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: .3 },
        });
      }
    });
    return () => { window.removeEventListener('pagehide', remember); media.revert(); };
  }, [studio, motionOverride]);

  const go = (index: number) => {
    const current = trigger.current;
    if (current) {
      window.scrollTo({ top: current.start + chapterTimes[index] / storyDuration * (current.end - current.start), behavior: 'auto' });
    } else document.getElementById(chapters[index].toLowerCase())?.scrollIntoView({ behavior: 'auto' });
  };
  const changeMotion = () => {
    // An explicit mode switch must not replay a prior reload's scroll offset.
    restoreOnLoad.current = false;
    toggleMotion();
  };

  return <main ref={root} id="top" data-chapter={chapters[active].toLowerCase()} data-motion={motionOverride ? 'full' : 'system'}>
    <a href="#hero" className="skip-link">Skip to the concept</a>
    <header className="site-header">
      <a href="#top" aria-label="Nocturne — back to top" className="wordmark">N<span className="mark-slash">/</span> NOCTURNE</a>
      {desktop && (prefersReducedMotion || motionOverride) ? <div className="motion-controls">
        <span id="motion-reason">{motionOverride ? 'Motion enabled' : 'Reduced motion is on'}</span>
        <button type="button" onClick={changeMotion} aria-describedby="motion-reason">{motionOverride ? 'Use device settings' : 'Enable 3D & motion'}</button>
      </div> : <div className="header-center">INDEPENDENT DESIGN STUDY <span>—</span> 001</div>}
      <a href="#final" className="header-link">THE CONCEPT <span><Arrow /></span></a>
    </header>
    <div ref={stage} className={`experience-stage ${live ? 'is-live' : ''}`}>
      <div role="img" aria-label={`Unbranded graphite concept car — ${chapters[active]} studio view`} className={`scene-layer ${status === 'ready' ? 'scene-ready' : ''}`}>
        <div className="poster-sequence" aria-hidden="true">
          {stills.map((name, index) => <img key={`${name}-${index}`} className="scene-poster" src={assetPath(`/images/${name}.webp`)} alt="" fetchPriority={index === 0 ? 'high' : 'auto'} decoding="async" />)}
        </div>
        {live && !assetFailed && <SceneBoundary onError={onError}><VehicleScene state={studio} register={register} onReady={onReady} onError={onError} /></SceneBoundary>}
      </div>
      <div className="stage-vignette" />
      <div className="chapter-grid">
        <section id="hero" className="chapter hero" aria-labelledby="hero-title">
          <div className="eyebrow"><span className="red-line" /> AUTOMOTIVE EXPLORATION — VOL. 01</div>
          <h1 id="hero-title"><Line>A study</Line><Line>in <em>motion.</em></Line></h1>
          <div className="hero-bottom"><p>Not built to blend in.<br />An exploration of form, light, and presence.</p><button onClick={() => go(1)} className="text-link">EXPLORE THE CONCEPT <span><Arrow down /></span></button></div>
          <img className="mobile-car" src={assetPath('/images/hero.webp')} alt="Unbranded graphite concept car, front three-quarter studio view" fetchPriority="high" />
        </section>
        <section id="design" className="chapter editorial design" aria-labelledby="design-title">
          <div className="eyebrow"><span className="red-line" /> 01 / DESIGN</div>
          <h2 id="design-title"><Line>Less noise.</Line><Line><em>More presence.</em></Line></h2>
          <p>A continuous silhouette. A deliberate line.<br />Nothing added without a reason.</p>
          <div className="chapter-note"><span>FORM LANGUAGE</span><span>SCULPTED / UNBROKEN</span></div>
          <img className="mobile-car" src={assetPath('/images/design.webp')} alt="Side profile of the unbranded concept car" loading="lazy" />
        </section>
        <section id="performance" className="chapter editorial performance" aria-labelledby="performance-title">
          <div className="eyebrow"><span className="red-line" /> 02 / PERFORMANCE</div>
          <h2 id="performance-title"><Line>Motion.</Line><Line><em>Before movement.</em></Line></h2>
          <p>A low stance. A purposeful proportion.<br />The visual expression of energy, held still.</p>
          <div className="chapter-note"><span>A DESIGN EXPLORATION</span><span>NO PERFORMANCE CLAIMS</span></div>
          <img className="mobile-car" src={assetPath('/images/performance.webp')} alt="Low rear three-quarter view of the concept car" loading="lazy" />
        </section>
        <section id="details" className="chapter editorial details" aria-labelledby="details-title">
          <div className="eyebrow"><span className="red-line" /> 03 / DETAILS</div>
          <h2 id="details-title"><Line>The closer</Line><Line><em>you look.</em></Line></h2>
          <p>Graphite surfaces meet a precise edge of light.<br />A quiet dialogue between material and form.</p>
          <div className="chapter-note detail-note"><span>MATERIAL STUDY</span><span>GRAPHITE / LIGHT / SHADOW</span></div>
          <img className="mobile-car" src={assetPath('/images/details.webp')} alt="Close studio framing of the front bodywork and wheel" loading="lazy" />
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
        <span className="scene-status" role="status">{desktop && (!prefersReducedMotion || motionOverride) && status === 'fallback' ? 'CINEMATIC STUDIO / IMAGE SEQUENCE' : live ? (status === 'ready' ? 'LIVE 3D EXPERIENCE' : 'LOADING 3D / STUDIO VIEW') : 'STUDIO EDITION'}</span>
        <span className="scroll-cue">SCROLL TO DISCOVER <span><Arrow down /></span></span>
      </div>
    </div>
    <section id="final" className="final-section" aria-labelledby="final-title">
      <img src={assetPath('/images/hero.webp')} alt="The graphite concept in its studio setting" loading="lazy" />
      <div className="final-content">
        <div className="eyebrow"><span className="red-line" /> THE STUDY CONTINUES</div>
        <h2 id="final-title"><Line>Leave an</Line><Line><em>impression.</em></Line></h2>
        <a href="#top" className="cta"><span>EXPERIENCE IT AGAIN</span><span className="cta-arrow"><Arrow /></span></a>
      </div>
      <footer className="final-footer">
        <span className="wordmark">N<span className="mark-slash">/</span> NOCTURNE</span>
        <p>An independent, fictional automotive study.<br />Not affiliated with a vehicle manufacturer.</p>
        <details className="credits"><summary>ASSET CREDITS +</summary><p>“Car Concept” by Eric Chadwick, © 2024 Darmstadt Graphics Group GmbH. <a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept">Source</a> · <a href={assetPath('/licenses/carconcept-CC-BY-4.0.txt')}>CC BY 4.0</a>. Modified: marks and original textures removed; materials replaced; normalized and optimized. No endorsement implied.</p></details>
      </footer>
    </section>
  </main>;
}
