import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Optional tooling lives outside the app: see docs/CINEMATIC-STUDIO.md.
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.env.EVIDENCE_DIR || '/tmp/nocturne-browser-evidence';
const base = 'http://127.0.0.1:3200';
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const ids = ['hero', 'design', 'performance', 'details'];
const results = [], errors = [], failedModels = [], hashes = {}, frames = {}, canvases = {}, comparisons = {};
let server, browser;

async function newPage(options = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference', ...options });
  page.on('pageerror', error => errors.push(error.message));
  // Observe real rendered camera/light values through Three's devtools hook.
  // This is injected only by the test, with no app globals or production hooks.
  await page.addInitScript(() => {
    window.__studioFrames = [];
    window.__THREE_DEVTOOLS__ = new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe', event => {
      const renderer = event.detail;
      if (!renderer.isWebGLRenderer) return;
      const render = renderer.render.bind(renderer);
      renderer.render = (scene, camera) => {
        render(scene, camera);
        if (renderer.getRenderTarget() || !camera.isPerspectiveCamera) return;
        window.__studioFrame = {
          position: camera.position.toArray(), projection: camera.projectionMatrix.elements.slice(),
          environment: scene.environmentIntensity,
          lights: scene.children.filter(object => object.isLight).map(light => ({ intensity: light.intensity, position: light.position.toArray() })),
          calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
          geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
        };
        window.__studioFrames.push(window.__studioFrame);
        if (window.__studioFrames.length > 300) window.__studioFrames.shift();
      };
    });
  });
  return page;
}
async function ready(page) {
  await page.waitForFunction(() => document.querySelector('.scene-status')?.textContent === 'LIVE 3D EXPERIENCE');
  await page.waitForFunction(() => window.__studioFrame?.environment >= .7499, undefined, { timeout: 60000 });
}
async function settled(page) {
  // Test rendered state, not a fixed sleep: numeric scrub/entrances take more
  // wall time under a software GPU. Include DOM transforms in the idle check.
  await page.waitForFunction(() => {
    const spacer = document.querySelector('.pin-spacer');
    const stage = document.querySelector('.experience-stage');
    if (!spacer) return true;
    const distance = spacer.offsetHeight - stage.offsetHeight;
    const expected = Math.max(0, Math.min(1, scrollY / distance));
    const actual = Number(document.querySelector('main').style.getPropertyValue('--story-progress'));
    return Math.abs(expected - actual) < .00001;
  }, undefined, { timeout: 60000 });
  let last = '', stable = 0;
  for (let attempt = 0; attempt < 100; attempt++) {
    await sleep(150);
    const snapshot = await page.evaluate(() => JSON.stringify({
      frame: window.__studioFrame,
      text: [...document.querySelectorAll('.chapter, .reveal-line > span')].map(element => {
        const style = getComputedStyle(element);
        return [style.opacity, style.visibility, style.transform];
      }),
    }));
    stable = snapshot === last ? stable + 1 : 0;
    last = snapshot;
    if (stable >= 4) return;
  }
  throw new Error('Camera/text did not settle');
}
async function screenshot(page, name, fullPage = false) {
  await page.screenshot({ path: `${out}/${name}.png`, fullPage });
}
async function sample(page, name, y) {
  await page.evaluate(top => scrollTo(0, top), y);
  await settled(page);
  const buffer = await page.locator('canvas').screenshot();
  const frame = await page.evaluate(() => window.__studioFrame);
  assert(Math.hypot(frame.position[0], frame.position[2]) > 4, 'Camera must remain outside the vehicle');
  frames[name] = frame;
  canvases[name] = buffer;
  hashes[name] = crypto.createHash('sha256').update(canvases[name]).digest('hex');
}

try {
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3200'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'inherit',
  });
  process.on('SIGINT', () => { server.kill(); process.exit(130); });
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(base)).ok) break; } catch { /* Server starting. */ }
    await sleep(200);
  }
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const page = await newPage();
  let modelLoads = 0;
  page.on('response', response => {
    if (response.url().endsWith('concept.glb')) {
      modelLoads++;
      if (response.status() !== 200) failedModels.push(response.status());
    }
  });
  await page.goto(base);
  await ready(page);
  await settled(page);
  assert.equal(await page.locator('canvas').count(), 1);
  assert.equal(await page.locator('.pin-spacer').count(), 1);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('canvas')).opacity), '1');
  assert(await page.evaluate(() => window.__studioFrames.some(frame => frame.environment < .4)));
  results.push('Model loaded; a real rendered light reveal went from silhouette to lit studio, with one visible canvas and one pin.');

  for (const [name, y] of [['hero', 0], ['forward-1000', 1000], ['forward-2000', 2000], ['forward-3000', 3000], ['forward-4000', 4000], ['forward-5000', 5000], ['reverse-3000', 3000], ['reverse-2000', 2000], ['reverse-1000', 1000], ['reverse-hero', 0]]) {
    await sample(page, name, y);
    if (['hero', 'forward-3000', 'reverse-hero'].includes(name)) await screenshot(page, name);
  }
  fs.writeFileSync(`${out}/motion-frames.json`, JSON.stringify({ frames, hashes }, null, 2));
  console.log('Reverse camera positions', frames['forward-2000'].position, frames['reverse-2000'].position);
  assert.notEqual(hashes.hero, hashes['forward-2000']);
  // A scrubbed tween may settle on adjacent floating-point values from opposite
  // directions. Check the actual camera and rendered pixels, allowing only tiny
  // antialiasing differences rather than requiring byte-identical PNG encoding.
  const cameraDelta = Math.max(...frames['forward-2000'].position.map((value, index) => Math.abs(value - frames['reverse-2000'].position[index])));
  assert(cameraDelta < .0001);
  comparisons.reverse2000 = await page.evaluate(async encoded => {
    const images = await Promise.all(encoded.map(async source => createImageBitmap(await (await fetch(source)).blob())));
    const canvas = document.createElement('canvas');
    canvas.width = images[0].width; canvas.height = images[0].height;
    const context = canvas.getContext('2d');
    const data = images.map(image => { context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0); return context.getImageData(0, 0, canvas.width, canvas.height).data; });
    let changed = 0;
    for (let pixel = 0; pixel < data[0].length; pixel += 4) {
      if ([0, 1, 2].some(channel => Math.abs(data[0][pixel + channel] - data[1][pixel + channel]) > 2)) changed++;
    }
    images.forEach(image => image.close());
    return { changedPixels: changed, fraction: changed / (canvas.width * canvas.height) };
  }, ['forward-2000', 'reverse-2000'].map(name => 'data:image/png;base64,' + canvases[name].toString('base64')));
  comparisons.reverse2000.cameraDelta = cameraDelta;
  console.log('Reverse frame comparison', comparisons.reverse2000);
  assert(comparisons.reverse2000.fraction < .001);
  assert.equal(hashes.hero, hashes['reverse-hero']);
  assert(frames['forward-3000'].position.every((value, index) => Math.abs(value - frames['reverse-3000'].position[index]) < .0001));
  results.push('Forward/reverse scroll changes the rendered camera/light frame, stays outside the car, and returns to matching rendered views (subpixel tolerance) and an identical opening canvas.');

  for (let index = 1; index < 4; index++) {
    await page.getByRole('button', { name: `Explore ${ids[index][0].toUpperCase() + ids[index].slice(1)}`, exact: true }).click();
    await page.waitForFunction(id => document.querySelector('main').dataset.chapter === id, ids[index]);
    await settled(page);
    assert.equal(await page.locator(`#${ids[index]}`).evaluate(el => getComputedStyle(el).opacity), '1');
    assert(await page.locator(`#${ids[index]} .reveal-line > span`).evaluateAll(elements => elements.every(el => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m42) < .1)));
    await screenshot(page, ids[index]);
  }
  results.push('Every chapter button lands on the fully visible composed text and camera hold.');
  await page.getByRole('button', { name: 'Explore Hero', exact: true }).click();
  await settled(page);
  await page.mouse.move(1000, 500);
  await page.mouse.wheel(0, 1000);
  await page.waitForFunction(() => scrollY > 0);
  await settled(page);
  await page.mouse.wheel(0, -1000);
  await page.waitForFunction(() => scrollY === 0);
  await settled(page);
  results.push('Native wheel input works forward/reverse over the canvas.');

  await page.evaluate(() => scrollTo(0, 3000));
  await settled(page);
  await page.reload();
  await ready(page);
  await settled(page);
  assert.equal(await page.evaluate(() => scrollY), 3000);
  results.push('Mid-story reload restored scroll 3000 and the scene.');
  await page.evaluate(() => scrollTo(0, document.getElementById('final').offsetTop));
  await page.waitForFunction(() => [...document.querySelectorAll('.final-content .reveal-line > span')].every(el => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m42) < .1));
  await screenshot(page, 'final');
  await page.getByRole('link', { name: 'EXPERIENCE IT AGAIN' }).click();
  await page.waitForFunction(() => scrollY === 0);
  await settled(page);
  results.push('Final heading reveal and replay link return to the opening scene.');

  await page.setViewportSize({ width: 768, height: 1000 });
  await page.waitForFunction(() => !document.querySelector('canvas'));
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/models/concept.glb', async route => { await gate; await route.continue(); });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForFunction(() => document.querySelector('.scene-status').textContent === 'LOADING 3D / STUDIO VIEW');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.scene-poster')).opacity), '1');
  await screenshot(page, 'reentry-loading');
  release();
  await ready(page);
  await settled(page);
  await screenshot(page, 'reentry-ready');
  await page.unroute('**/models/concept.glb');
  for (let cycle = 0; cycle < 2; cycle++) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !document.querySelector('canvas'));
    assert.equal(await page.locator('.pin-spacer').count(), 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await ready(page);
    assert.equal(await page.locator('canvas').count(), 1);
    assert.equal(await page.locator('.pin-spacer').count(), 1);
  }
  results.push('Responsive reentry, delayed loading and two motion-setting cycles retain the poster/recover exactly one live scene.');
  await page.evaluate(() => document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForFunction(() => document.querySelector('.scene-status').textContent.includes('UNAVAILABLE'));
  await sleep(1000);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.scene-poster')).opacity), '1');
  await screenshot(page, 'context-loss');
  results.push('Actual GPU context loss retains the accessible studio poster.');
  await page.close();

  const variants = [
    ['mobile', { viewport: { width: 390, height: 844 } }],
    ['tablet', { viewport: { width: 768, height: 900 } }],
    ['reduced', { reducedMotion: 'reduce' }],
    ['no-webgl', {}], ['model-error', {}], ['no-js', { javaScriptEnabled: false }],
  ];
  for (const [name, options] of variants) {
    const fallback = await newPage(options);
    let requested = 0;
    fallback.on('request', request => { if (request.url().endsWith('concept.glb')) requested++; });
    if (name === 'no-webgl') await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) { return /webgl/.test(type) ? null : original.call(this, type, ...args); };
    });
    if (name === 'model-error') await fallback.route('**/models/concept.glb', route => route.abort());
    await fallback.goto(base);
    if (name === 'model-error') await fallback.waitForFunction(() => document.querySelector('.scene-status').textContent.includes('UNAVAILABLE'));
    if (name === 'no-webgl' || name === 'model-error') {
      assert.equal(await fallback.evaluate(() => getComputedStyle(document.querySelector('.scene-poster')).opacity), '1');
    } else {
      assert.equal(requested, 0);
      assert.equal(await fallback.locator('canvas').count(), 0);
      for (const id of [...ids, 'final']) {
        await fallback.locator(`#${id}`).scrollIntoViewIfNeeded();
        await fallback.waitForFunction(id => [...document.querySelectorAll(`#${id} .reveal-line > span`)].every(el => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m42) < .1), id);
        await fallback.locator(`#${id} img`).evaluate(image => image.decode());
        assert(await fallback.locator(`#${id}`).isVisible());
      }
      assert(await fallback.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await fallback.evaluate(() => scrollTo(0, 0));
    }
    if (name === 'reduced') {
      await fallback.keyboard.press('Tab');
      assert.equal(await fallback.locator(':focus').textContent(), 'Skip to the concept');
    }
    await screenshot(fallback, name, !['no-webgl', 'model-error'].includes(name));
    results.push(`${name}: visible fallback/content, model requests=${requested}`);
    await fallback.close();
  }
  assert.equal(errors.length, 0);
  assert.equal(failedModels.length, 0);
  assert(modelLoads >= 4);
  const report = { browser: await browser.version(), viewport: '1440x1000', rendering: 'SwiftShader software WebGL2', results, errors, failedModels, modelLoads, hashes, frames, comparisons };
  fs.writeFileSync(`${out}/browser-results.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ results, errors, failedModels, modelLoads }, null, 2));
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
}
