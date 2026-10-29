'use client';
/* Static posters deliberately use the same debranded asset as the live scene. */
/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic';
import { Component, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { CameraState } from './VehicleScene';
const VehicleScene = dynamic(()=>import('./VehicleScene'),{ssr:false});
function Arrow({down=false}:{down?:boolean}){return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" style={{display:'inline-block',transform:down?'rotate(135deg)':undefined}}><path d="M3 13 13 3M3 3h10v10" stroke="currentColor" strokeWidth="1.25"/></svg>;}
const chapters = ['Hero','Design','Performance','Details'];
const poses: CameraState[] = [
  {x:6,y:2.6,z:7,tx:0,ty:.65,tz:0,offset:-.12},
  {x:12,y:3,z:.6,tx:0,ty:.6,tz:0,offset:-.22},
  {x:-7,y:2.8,z:-9,tx:0,ty:.6,tz:0,offset:.2},
  {x:3.2,y:1.3,z:4.2,tx:0,ty:.65,tz:1,offset:-.22},
  {x:5.5,y:2.7,z:7,tx:0,ty:.6,tz:0,offset:0},
];
class SceneBoundary extends Component<{children:ReactNode; onError:()=>void},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){this.props.onError();}
  render(){return this.state.failed?null:this.props.children;}
}
export default function Experience(){
  const root=useRef<HTMLElement>(null);
  const stage=useRef<HTMLDivElement>(null);
  const [camera]=useState<CameraState>(()=>({...poses[0]}));
  const draw=useRef(()=>{});
  const trigger=useRef<ScrollTrigger|null>(null);
  const [active,setActive]=useState(0);
  const [live,setLive]=useState(false);
  const [status,setStatus]=useState<'loading'|'ready'|'fallback'>('loading');
  const [assetFailed,setAssetFailed]=useState(false);
  const register=useCallback((fn:()=>void)=>{draw.current=fn;},[]);
  const onReady=useCallback(()=>{setStatus('ready');},[]);
  const onError=useCallback(()=>{setStatus('fallback'); setAssetFailed(true);},[]);
  useEffect(()=>{
    gsap.registerPlugin(ScrollTrigger);
    // Restore after pin spacing exists; otherwise the browser can clamp a reload
    // to the shorter server-rendered document before ScrollTrigger initializes.
    let restoreTop: number | null = null;
    const navigation=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    try {
      const saved=JSON.parse(sessionStorage.getItem('nocturne-scroll') || 'null');
      if(navigation?.type==='reload' && saved?.width===window.innerWidth) restoreTop=saved.y;
    } catch { /* Storage can be unavailable in privacy mode. Native restoration remains. */ }
    const remember=()=>{try {sessionStorage.setItem('nocturne-scroll',JSON.stringify({y:window.scrollY,width:window.innerWidth}));}catch{}};
    window.addEventListener('pagehide',remember);
    const media=gsap.matchMedia();
    media.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)',()=>{
      const canvas=document.createElement('canvas');
      const gl=canvas.getContext('webgl2');
      const supported=!!gl;
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      // Every desktop entry owns a fresh renderer and model load. Do not carry
      // readiness or a previous failure across responsive/reduced-motion modes.
      setAssetFailed(false);
      setStatus(supported?'loading':'fallback');
      setLive(supported);
      const panels=gsap.utils.toArray<HTMLElement>('.chapter',root.current);
      gsap.set(panels.slice(1),{autoAlpha:0,y:35});
      const tl=gsap.timeline({scrollTrigger:{trigger:stage.current,start:'top top',end:()=>'+='+window.innerHeight*5.5,pin:true,scrub:true,invalidateOnRefresh:true,onUpdate:self=>setActive(Math.min(3,Math.floor(self.progress*4)))}});
      trigger.current=tl.scrollTrigger!;
      for(let i=0;i<4;i++){
        tl.addLabel(chapters[i].toLowerCase(),i);
        tl.to(camera,{...poses[i+1],duration:1,ease:'sine.inOut',onUpdate:()=>draw.current()},i);
        if(i<3){
          tl.to(panels[i],{autoAlpha:0,y:-25,duration:.16},i+.76);
          tl.to(panels[i+1],{autoAlpha:1,y:0,duration:.18},i+.9);
        }
      }
      const refresh=()=>ScrollTrigger.refresh();
      document.fonts.ready.then(()=>requestAnimationFrame(()=>{
        refresh();
        if(restoreTop!==null){window.scrollTo(0,restoreTop);restoreTop=null;ScrollTrigger.update();}
      }));
      return ()=>{trigger.current=null;setLive(false);};
    });
    return ()=>{window.removeEventListener('pagehide',remember);media.revert();};
  },[camera]);
  const go=(index:number)=>{
    if(trigger.current){window.scrollTo({top:trigger.current.start+((index===0?0:index+.15)/4)* (trigger.current.end-trigger.current.start),behavior:'auto'});}
    else document.getElementById(chapters[index].toLowerCase())?.scrollIntoView({behavior:'auto'});
  };
  return <main ref={root} id="top">
    <a href="#hero" className="skip-link">Skip to the concept</a>
    <header className="site-header flex items-center justify-between">
      <a href="#top" aria-label="Nocturne — back to top" className="wordmark">N<span className="mark-slash">/</span> NOCTURNE</a>
      <div className="header-center">INDEPENDENT DESIGN STUDY <span>—</span> 001</div>
      <a href="#final" className="header-link">THE CONCEPT <span><Arrow/></span></a>
    </header>
    <div ref={stage} className={`experience-stage ${live?'is-live':''}`}>
      <div role="img" aria-label={`Unbranded graphite concept car — ${chapters[active]} studio view`} className={`scene-layer ${status==='ready'?'scene-ready':''}`}>
        <img className="scene-poster" src={`/images/${['hero','design','performance','details'][active]}.webp`} alt="" fetchPriority="high" />
        {live&&!assetFailed&&<SceneBoundary onError={onError}><VehicleScene state={camera} register={register} onReady={onReady} onError={onError}/></SceneBoundary>}
      </div>
      <div className="stage-vignette"/>
      <div className="chapter-grid">
        <section id="hero" className="chapter hero" aria-labelledby="hero-title">
          <div className="eyebrow"><span className="red-line"/> AUTOMOTIVE EXPLORATION — VOL. 01</div>
          <h1 id="hero-title">A study<br/>in <em>motion.</em></h1>
          <div className="hero-bottom"><p>Not built to blend in.<br/>An exploration of form, light, and presence.</p><button onClick={()=>go(1)} className="text-link">EXPLORE THE CONCEPT <span><Arrow down/></span></button></div>
          <img className="mobile-car" src="/images/hero.webp" alt="Unbranded graphite concept car, front three-quarter studio view" fetchPriority="high"/>
        </section>
        <section id="design" className="chapter editorial design" aria-labelledby="design-title">
          <div className="eyebrow"><span className="red-line"/> 01 / DESIGN</div>
          <h2 id="design-title">Less noise.<br/><em>More presence.</em></h2>
          <p>A continuous silhouette. A deliberate line.<br/>Nothing added without a reason.</p>
          <div className="chapter-note"><span>FORM LANGUAGE</span><span>SCULPTED / UNBROKEN</span></div>
          <img className="mobile-car" src="/images/design.webp" alt="Side profile of the unbranded concept car" loading="lazy"/>
        </section>
        <section id="performance" className="chapter editorial performance" aria-labelledby="performance-title">
          <div className="eyebrow"><span className="red-line"/> 02 / PERFORMANCE</div>
          <h2 id="performance-title">Motion.<br/><em>Before movement.</em></h2>
          <p>A low stance. A purposeful proportion.<br/>The visual expression of energy, held still.</p>
          <div className="chapter-note"><span>A DESIGN EXPLORATION</span><span>NO PERFORMANCE CLAIMS</span></div>
          <img className="mobile-car" src="/images/performance.webp" alt="Low rear three-quarter view of the concept car" loading="lazy"/>
        </section>
        <section id="details" className="chapter editorial details" aria-labelledby="details-title">
          <div className="eyebrow"><span className="red-line"/> 03 / DETAILS</div>
          <h2 id="details-title">The closer<br/><em>you look.</em></h2>
          <p>Graphite surfaces meet a precise edge of light.<br/>A quiet dialogue between material and form.</p>
          <div className="chapter-note"><span>MATERIAL STUDY</span><span>GRAPHITE / LIGHT / SHADOW</span></div>
          <img className="mobile-car" src="/images/details.webp" alt="Close studio framing of the front bodywork and wheel" loading="lazy"/>
        </section>
      </div>
      <nav className="chapter-nav" aria-label="Concept chapters">{chapters.map((name,i)=><button key={name} onClick={()=>go(i)} aria-label={`Explore ${name}`} aria-current={active===i?'step':undefined}><span className="nav-number">0{i+1}</span><span className="nav-rule"/><span className="nav-label">{name==='Hero'?'INTRO':name.toUpperCase()}</span></button>)}</nav>
      <div className="stage-footer"><span>FICTIONAL CONCEPT / PORTFOLIO DEMO</span><span className="scene-status" role="status">{live?(status==='ready'?'LIVE 3D EXPERIENCE':status==='fallback'?'STUDIO VIEW / 3D UNAVAILABLE':'LOADING 3D / STUDIO VIEW'):'STUDIO EDITION'}</span><span className="scroll-cue">SCROLL TO DISCOVER <span><Arrow down/></span></span></div>
    </div>
    <section id="final" className="final-section" aria-labelledby="final-title">
      <img src="/images/hero.webp" alt="The graphite concept in its studio setting" loading="lazy"/>
      <div className="final-content"><div className="eyebrow"><span className="red-line"/> THE STUDY CONTINUES</div><h2 id="final-title">Leave an<br/><em>impression.</em></h2><a href="#top" className="cta">EXPERIENCE IT AGAIN <span><Arrow/></span></a></div>
      <footer className="final-footer"><span className="wordmark">N/ NOCTURNE</span><p>An independent, fictional automotive study.<br/>Not affiliated with a vehicle manufacturer.</p><details className="credits"><summary>ASSET CREDITS +</summary><p>“Car Concept” by Eric Chadwick, © 2024 Darmstadt Graphics Group GmbH. <a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept">Source</a> · <a href="/licenses/carconcept-CC-BY-4.0.txt">CC BY 4.0</a>. Modified: marks and original textures removed; materials replaced; normalized and optimized. No endorsement implied.</p></details></footer>
    </section>
  </main>;
}
