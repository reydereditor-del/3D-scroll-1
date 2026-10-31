import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial, Texture, Box3, Vector3 } from 'three';
import { AssetRequestGate } from '../lib/assetRequestGate.ts';
import { normalizeVehicle, disposeVehicle } from '../lib/vehicleAssets.ts';
import { sampleStudioPose, studioPoses, chapterTimes, storyDuration } from '../lib/studioDirection.ts';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function assertPose(actual, expected) {
  for (const key of Object.keys(expected)) assert.ok(Math.abs(actual[key] - expected[key]) < 1e-10, key);
}

test('a late download cannot replace a newer car and is released', async () => {
  const released = [], old = deferred(), recent = deferred();
  const gate = new AssetRequestGate(value => released.push(value));
  const first = gate.load(() => old.promise);
  const second = gate.load(() => recent.promise);
  recent.resolve('Porsche');
  assert.equal(await second, 'Porsche');
  old.resolve('Pagani');
  assert.equal(await first, null);
  assert.deepEqual(released, ['Pagani']);
});

test('cancelled downloads release their assets and stale failures are ignored', async () => {
  const released = [], late = deferred();
  const gate = new AssetRequestGate(value => released.push(value));
  const pending = gate.load(() => late.promise);
  gate.cancel(); late.resolve('late');
  assert.equal(await pending, null);
  assert.deepEqual(released, ['late']);
  const failed = deferred(), stale = gate.load(() => failed.promise);
  gate.cancel(); failed.reject(new Error('cancelled network request'));
  assert.equal(await stale, null);
  await assert.rejects(gate.load(async () => { throw new Error('current download failed'); }), /current download failed/);
});

test('normalization grounds and centers a transformed car without changing geometry', () => {
  const group = new Group();
  const geometry = new BoxGeometry(2, 1, 8), material = new MeshStandardMaterial();
  const mesh = new Mesh(geometry, material); mesh.position.set(3, 4, -2); group.add(mesh);
  const vertices = geometry.attributes.position.array.slice();
  normalizeVehicle(group, Math.PI / 2);
  const bounds = new Box3().setFromObject(group, true), size = bounds.getSize(new Vector3()), center = bounds.getCenter(new Vector3());
  assert.ok(Math.abs(Math.max(size.x, size.z) - 4.8) < 1e-6);
  assert.ok(Math.abs(bounds.min.y) < 1e-6 && Math.abs(center.x) < 1e-6 && Math.abs(center.z) < 1e-6);
  assert.deepEqual(geometry.attributes.position.array, vertices);
  disposeVehicle(group);
  assert.throws(() => normalizeVehicle(new Group(), 0), /valid geometry/);
});

test('shared materials, geometry, and full-resolution textures dispose once', () => {
  const group = new Group(), geometry = new BoxGeometry(), texture = new Texture();
  const material = new MeshStandardMaterial({ map: texture, roughnessMap: texture });
  group.add(new Mesh(geometry, material), new Mesh(geometry, material));
  const counts = { geometry: 0, material: 0, texture: 0 };
  geometry.addEventListener('dispose', () => counts.geometry++);
  material.addEventListener('dispose', () => counts.material++);
  texture.addEventListener('dispose', () => counts.texture++);
  disposeVehicle(group); disposeVehicle(group);
  assert.deepEqual(counts, { geometry: 1, material: 1, texture: 1 });
});

test('each car samples the current chapter without resetting the playhead', () => {
  const before = structuredClone(studioPoses);
  const other = studioPoses.map(pose => ({ ...pose, radius: pose.radius + 2 }));
  for (let i = 0; i < chapterTimes.length; i++) {
    assertPose(sampleStudioPose(chapterTimes[i], studioPoses), studioPoses[i]);
    assertPose(sampleStudioPose(chapterTimes[i], other), other[i]);
  }
  assertPose(sampleStudioPose(storyDuration, studioPoses), studioPoses[4]);
  const times = [0, .7, 1.2, 2.05, 3.1, 3.95, 4.8, 5.9, 7.4];
  const forward = times.map(time => sampleStudioPose(time, studioPoses));
  const backward = [...times].reverse().map(time => sampleStudioPose(time, studioPoses)).reverse();
  assert.deepEqual(forward, backward);
  assert.deepEqual(studioPoses, before);
});
