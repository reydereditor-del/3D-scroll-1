import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Optional Playwright tooling stays outside application dependencies.
const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:3300/3D-scroll-1/';
const out = process.env.EVIDENCE_DIR || '/tmp/nocturne-motion-evidence';
fs.mkdirSync(out, { recursive: true });
const local = ['127.0.0.1', 'localhost'].includes(new URL(base).hostname);
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
  proxy: !local && process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const errors = [], failedResponses = [], checks = [], frames = {};

async function newPage(options = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', ...options });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) failedResponses.push({ url: response.url(), status: response.status() }); });
  await page.addInitScript(() => {
    window.__THREE_DEVTOOLS__ = new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe', event => {
      const renderer = event.detail;
      if (!renderer.isWebGLRenderer) return;
      const render = renderer.render.bind(renderer);
      renderer.render = (scene, camera) => {
        render(scene, camera);
        if (!renderer.getRenderTarget() && camera.isPerspectiveCamera)
          window.__motionFrame = { camera: camera.position.toArray(), environment: scene.environmentIntensity };
      };
    });
  });
  return page;
}
async function ready(page) {
  await page.waitForFunction(() => document.querySelector('.scene-status')?.textContent === 'LIVE 3D EXPERIENCE' && window.__motionFrame?.environment >= .7499, undefined, { timeout: 90000 });
  assert.equal(await page.locator('canvas').count(), 1);
  assert.equal(await page.locator('.pin-spacer').count(), 1);
  assert.equal(await page.locator('.scene-layer').evaluate(el => getComputedStyle(el).display), 'block');
  assert.equal(await page.locator('canvas').evaluate(el => getComputedStyle(el).opacity), '1');
}
async function settled(page) {
  await page.waitForFunction(() => {
    const spacer = document.querySelector('.pin-spacer');
    const stage = document.querySelector('.experience-stage');
    const expected = Math.max(0, Math.min(1, scrollY / (spacer.offsetHeight - stage.offsetHeight)));
    return Math.abs(expected - Number(document.querySelector('main').style.getPropertyValue('--story-progress'))) < .00001;
  }, undefined, { timeout: 60000 });
  let last = '', stable = 0;
  for (let i = 0; i < 100; i++) {
    await page.waitForTimeout(150);
    const value = await page.evaluate(() => JSON.stringify({ frame: window.__motionFrame,
      text: [...document.querySelectorAll('.chapter, .reveal-line > span')].map(el => {
        const css = getComputedStyle(el); return [css.opacity, css.visibility, css.transform];
      }) }));
    stable = value === last ? stable + 1 : 0; last = value;
    if (stable >= 4) return;
  }
  throw new Error('Rendered motion did not settle');
}
async function still(page) {
  await page.waitForFunction(() => document.querySelector('.scene-status')?.textContent === 'STUDIO EDITION');
  assert.equal(await page.locator('canvas').count(), 0);
  assert.equal(await page.locator('.pin-spacer').count(), 0);
  assert.equal(await page.locator('section').count(), 5);
}

try {
  const page = await newPage();
  let modelRequests = 0;
  page.on('request', request => { if (request.url().endsWith('concept.glb')) modelRequests++; });
  await page.goto(base);
  await page.getByRole('button', { name: 'Enable 3D & motion', exact: true }).waitFor();
  await still(page);
  assert.equal(modelRequests, 0);
  assert.equal(await page.locator('.scene-layer').evaluate(el => getComputedStyle(el).display), 'none');
  await page.screenshot({ path: `${out}/reduced-default.png` });
  checks.push('Reduced-motion default: readable still edition, clear opt-in, no model request or pin.');

  await page.evaluate(() => {
    window.__textTransforms = [];
    new MutationObserver(() => window.__textTransforms.push(getComputedStyle(document.querySelector('.hero .reveal-line > span')).transform))
      .observe(document.querySelector('.hero .reveal-line > span'), { attributes: true, attributeFilter: ['style'] });
  });
  const enable = page.getByRole('button', { name: 'Enable 3D & motion', exact: true });
  await enable.focus();
  await page.keyboard.press('Enter');
  await ready(page);
  await settled(page);
  assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
  assert.equal(await page.locator('main').getAttribute('data-motion'), 'full');
  assert(await page.evaluate(() => new Set(window.__textTransforms).size > 3));
  assert(modelRequests > 0);
  checks.push('Keyboard opt-in starts visible WebGL and actual text transforms while the OS still reports reduced motion.');
  for (const [name, y] of [['hero', 0], ['forward', 2000], ['rear', 3000], ['reverse', 2000], ['return', 0]]) {
    await page.evaluate(top => scrollTo(0, top), y);
    await settled(page);
    frames[name] = await page.evaluate(() => window.__motionFrame);
    if (['hero', 'rear'].includes(name)) await page.screenshot({ path: `${out}/${name}.png` });
  }
  assert.notDeepEqual(frames.hero.camera, frames.forward.camera);
  const reverseDelta = Math.max(...frames.forward.camera.map((x, i) => Math.abs(x - frames.reverse.camera[i])));
  assert(reverseDelta < .0001);
  await page.mouse.move(1000, 500);
  await page.mouse.wheel(0, 650); await page.waitForFunction(() => scrollY > 0); await settled(page);
  await page.mouse.wheel(0, -650); await page.waitForFunction(() => scrollY === 0); await settled(page);
  checks.push('Opted-in forward/reverse camera and native wheel input work; matching reverse position has delta ' + reverseDelta + '.');

  await page.evaluate(() => scrollTo(0, 2000)); await settled(page);
  await page.reload(); await ready(page); await settled(page);
  assert.equal(await page.evaluate(() => scrollY), 2000);
  await page.evaluate(() => scrollTo(0, 0)); await settled(page);
  await page.getByRole('button', { name: 'Use device settings', exact: true }).click(); await still(page);
  await page.getByRole('button', { name: 'Enable 3D & motion', exact: true }).click(); await ready(page); await settled(page);
  assert.equal(await page.evaluate(() => scrollY), 0);
  checks.push('Explicit choice and scroll survive mid-story reload; later mode switches do not replay its stale scroll position.');
  await page.setViewportSize({ width: 390, height: 844 }); await still(page);
  assert.equal(await page.locator('main').getAttribute('data-motion'), 'system');
  assert(await page.locator('.hero .mobile-car').isVisible());
  await page.setViewportSize({ width: 1440, height: 1000 }); await ready(page); await settled(page);
  checks.push('Resize to mobile preserves the image edition, then desktop restores the explicit opt-in with one canvas/pin.');
  await page.getByRole('button', { name: 'Use device settings', exact: true }).click(); await still(page);
  await page.reload(); await still(page);
  assert.equal(await page.locator('main').getAttribute('data-motion'), 'system');
  checks.push('Use device settings removes 3D/pinning and stays reduced after reload.');
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await ready(page); await settled(page);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await still(page);
  checks.push('Live OS preference changes enter and exit full motion without a stored opt-in.');
  await page.close();

  const blocked = await newPage();
  await blocked.addInitScript(() => { for (const name of ['getItem', 'setItem', 'removeItem']) Storage.prototype[name] = () => { throw new DOMException('Storage blocked', 'SecurityError'); }; });
  await blocked.goto(base); await blocked.getByRole('button', { name: 'Enable 3D & motion', exact: true }).click();
  await ready(blocked); await settled(blocked);
  await blocked.getByRole('button', { name: 'Use device settings', exact: true }).click(); await still(blocked); await blocked.close();
  checks.push('Explicit enable/reset works even when browser storage is blocked.');

  const noGL = await newPage();
  await noGL.addInitScript(() => { const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith('webgl') ? null : get.call(this, type, ...args); }; });
  await noGL.goto(base); await noGL.getByRole('button', { name: 'Enable 3D & motion', exact: true }).click();
  await noGL.waitForFunction(() => document.querySelector('.scene-status')?.textContent === 'STUDIO VIEW / 3D UNAVAILABLE');
  assert.equal(await noGL.locator('canvas').count(), 0);
  assert.equal(await noGL.locator('.scene-poster').evaluate(el => getComputedStyle(el).opacity), '1');
  await noGL.getByRole('button', { name: 'Use device settings', exact: true }).click(); await still(noGL); await noGL.close();
  checks.push('Unavailable WebGL keeps the poster and reports 3D unavailable; reset remains usable.');

  fs.writeFileSync(`${out}/results.json`, JSON.stringify({ base, testedAt: new Date().toISOString(), viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', softwareWebGL: true, checks, frames, reverseDelta, errors, failedResponses, passed: errors.length === 0 && failedResponses.length === 0 }, null, 2));
  assert.equal(failedResponses.length, 0, JSON.stringify(failedResponses));
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log(JSON.stringify({ base, checks, reverseDelta, errors, failedResponses, out }));
} finally { await browser.close(); }
