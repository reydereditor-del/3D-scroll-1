import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Resolve optional Playwright via NODE_PATH without adding app dependencies.
const { chromium } = createRequire(import.meta.url)('playwright');
const out=process.env.EVIDENCE_DIR || '/tmp/nocturne-browser-evidence';fs.mkdirSync(out,{recursive:true});
(async()=>{
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3200'],{cwd:fileURLToPath(new URL('..', import.meta.url)),stdio:'inherit'});process.on('exit',()=>server.kill());process.on('SIGINT',()=>process.exit(130));await new Promise(r=>setTimeout(r,1000));
const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const errors=[],failures=[],results=[];
async function page(opts={}){const p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference',...opts});p.on('pageerror',e=>errors.push(e.message));return p;}
const p=await page();let loads=0;p.on('response',r=>{if(r.url().endsWith('concept.glb')){loads++;if(r.status()!==200)failures.push(r.status());}});
const ready=()=>p.waitForFunction(()=>document.querySelector('.scene-status')?.textContent==='LIVE 3D EXPERIENCE');
await p.goto('http://127.0.0.1:3200');await ready();await p.waitForTimeout(1500);
assert.equal(await p.locator('.pin-spacer').count(),1);
assert.equal(await p.locator('canvas').count(),1);
assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('canvas')).opacity),'1');
const hashes={};
for(const [name,y] of [['hero',0],['forward-1000',1000],['forward-2000',2000],['forward-3000',3000],['forward-4000',4000],['reverse-3000',3000],['reverse-2000',2000],['reverse-1000',1000],['reverse-hero',0]]){
 await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(500);
 if(['hero','forward-3000','reverse-hero'].includes(name))await p.screenshot({path:`${out}/after-${name}.png`});
 const buffer=await p.locator('canvas').screenshot();hashes[name]=crypto.createHash('sha256').update(buffer).digest('hex');
}
assert.notEqual(hashes.hero,hashes['forward-2000']);assert.equal(hashes['forward-2000'],hashes['reverse-2000']);assert.equal(hashes.hero,hashes['reverse-hero']);results.push('Forward/reverse scrolling changes canvas pixels and returns to identical camera frames at y=2000 and y=0.');
await p.mouse.move(1000,500);await p.mouse.wheel(0,1000);await p.waitForTimeout(600);assert(await p.evaluate(()=>scrollY>0));await p.mouse.wheel(0,-1000);await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>scrollY),0);results.push('Native wheel input scrolls forward and reverse over the canvas.');await p.evaluate(()=>scrollTo(0,3000));await p.reload();await ready();await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>scrollY),3000);results.push('Mid-story reload restored scroll 3000.');
let release;const gate=new Promise(r=>release=r);await p.setViewportSize({width:768,height:1000});await p.waitForTimeout(800);await p.route('**/models/concept.glb',async r=>{await gate;await r.continue()});
await p.setViewportSize({width:1440,height:1000});await p.waitForTimeout(1500);
assert.equal(await p.locator('.scene-status').textContent(),'LOADING 3D / STUDIO VIEW');assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('.scene-poster')).opacity),'1');await p.screenshot({path:`${out}/after-reentry-loading.png`});release();await ready();await p.waitForTimeout(1200);await p.screenshot({path:`${out}/after-reentry-ready.png`});await p.unroute('**/models/concept.glb');
for(let i=0;i<2;i++){await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>!document.querySelector('canvas'),{},{timeout:10000});assert.equal(await p.locator('canvas').count(),0);assert.equal(await p.locator('.pin-spacer').count(),0);await p.emulateMedia({reducedMotion:'no-preference'});await ready();assert.equal(await p.locator('canvas').count(),1);assert.equal(await p.locator('.pin-spacer').count(),1);}
results.push('Tablet→desktop and two reduced-motion→desktop cycles recover one live canvas/one pin; delayed model retains visible poster.');
await p.evaluate(()=>document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await p.waitForFunction(()=>document.querySelector('.scene-status').textContent.includes('UNAVAILABLE'));await p.waitForTimeout(1200);assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('.scene-poster')).opacity),'1');await p.screenshot({path:`${out}/after-context-loss.png`});results.push('Genuine WebGL context loss retains visible poster.');
for(const [name,opts,init,abort] of [['mobile',{viewport:{width:390,height:844}},false,false],['tablet',{viewport:{width:768,height:900}},false,false],['reduced',{reducedMotion:'reduce'},false,false],['no-webgl',{},true,false],['model-error',{},false,true]]){
 const q=await page(opts);let requested=0;q.on('request',r=>{if(r.url().endsWith('concept.glb'))requested++});
 if(init)await q.addInitScript(()=>{const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:orig.call(this,type,...args)}});
 if(abort)await q.route('**/models/concept.glb',r=>r.abort());
 await q.goto('http://127.0.0.1:3200');await q.waitForTimeout(1800);
 if(!init&&!abort){assert.equal(requested,0);assert.equal(await q.locator('canvas').count(),0);for(const id of ['hero','design','performance','details','final'])assert(await q.locator('#'+id).isVisible());assert(await q.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 else {assert.equal(await q.evaluate(()=>getComputedStyle(document.querySelector('.scene-poster')).opacity),'1');if(abort)assert((await q.locator('.scene-status').textContent()).includes('UNAVAILABLE'));}
 await q.screenshot({path:`${out}/after-${name}.png`,fullPage:!init&&!abort});results.push(`${name}: fallback passed; model requests=${requested}`);await q.close();
}
assert.equal(errors.length,0);assert.equal(failures.length,0);assert(loads>=4);fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify({browser:await b.version(),viewport:'1440x1000',rendering:'Chromium SwiftShader software WebGL2',results,errors,failures,loads,hashes},null,2));console.log(JSON.stringify({results,errors,failures,loads},null,2));await b.close();server.kill();
})().catch(e=>{console.error(e);process.exit(1)});
