'use client';
// These effects intentionally mutate imperative Three.js GPU objects.
/* eslint-disable react-hooks/immutability */
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { CarDefinition } from '@/lib/carCatalog';
import { normalizeVehicle, disposeVehicle } from '@/lib/vehicleAssets';
import { AssetRequestGate } from '@/lib/assetRequestGate';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { assetPath } from '@/lib/assetPath';
import StudioFloor from './StudioFloor';
import {
  type Material, Color, DirectionalLight, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial,
  PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, Vector3,
} from 'three';

// Polar coordinates keep every camera transition outside the vehicle.
export type StudioState = {
  angle: number; radius: number; height: number;
  tx: number; ty: number; tz: number; offset: number;
  key: number; rim: number; sweep: number; opening: number; lens: number;
};

type SceneProps = {
  state: StudioState; register: (update: () => void) => void;
  car: CarDefinition; redraw: () => void;
  onReady: (id: string) => void; onLoadError: (id: string) => void; onError: () => void;
};
// Studio owns the camera after mount. React chapter updates must not reapply a
// position sampled midway through a GSAP tween over the imperative camera.
const initialCamera = { position: [0, 2.45, 10] as [number, number, number], fov: 32, near: .1, far: 250 };
const rendererOptions = { antialias: true, alpha: true, powerPreference: 'high-performance' as const };

function prepareVehicle(loaded: Group, car: CarDefinition) {
  normalizeVehicle(loaded, car.orientation);
  // Preserve authored materials, textures, and geometry on the new cars.
  if (car.materialProfile !== 'concept') return;
      const paint = new Map<MeshStandardMaterial, MeshPhysicalMaterial>();
      loaded.traverse(object => {
        if (!(object instanceof Mesh)) return;
        const tune = (material: Material) => {
          if (!(material instanceof MeshStandardMaterial)) return material;
          if (material.name === 'Original graphite finish') {
            if (!paint.has(material)) paint.set(material, new MeshPhysicalMaterial({
              name: material.name, color: new Color(.038, .044, .055),
              metalness: .72, roughness: .28, clearcoat: .8, clearcoatRoughness: .2,
              side: material.side,
            }));
            return paint.get(material)!;
          }
          if (material.name === 'Unmarked alloy') {
            material.color.setRGB(.19, .205, .23);
            material.metalness = .85;
            material.roughness = .29;
          }
          if (material.name === 'Opaque smoked glazing') {
            material.color.setRGB(.009, .012, .016);
            material.metalness = .25;
            material.roughness = .16;
          }
          if (material.name === 'White light lens') { material.emissive.set('#d5e8ff'); material.emissiveIntensity = 1.1; }
          if (material.name === 'Red light lens') { material.emissive.set('#ee2114'); material.emissiveIntensity = .9; }
          return material;
        };
        object.material = Array.isArray(object.material) ? object.material.map(tune) : tune(object.material);
      });
      paint.forEach((_, original) => original.dispose());
}

function Vehicle({ car, state, redraw, onReady, onLoadError }: Pick<SceneProps, 'car' | 'state' | 'redraw' | 'onReady' | 'onLoadError'>) {
  const [asset, setAsset] = useState<{ group: Group; car: CarDefinition } | null>(null);
  const visible = useRef<typeof asset>(null);
  const [requests] = useState(() => new AssetRequestGate<Group>(disposeVehicle));
  const { invalidate } = useThree();
  useEffect(() => {
    if (visible.current?.car.id === car.id) return;
    let cancelled = false;
    let candidate: Group | null = null;
    let fade: gsap.core.Tween | undefined;
    requests.load(async () => {
      const result = await new GLTFLoader().loadAsync(assetPath(car.modelSrc));
      try { prepareVehicle(result.scene, car); }
      catch (error) { disposeVehicle(result.scene); throw error; }
      return result.scene;
    }).then(group => {
      if (!group) return;
      candidate = group;
      if (cancelled) { disposeVehicle(group); candidate = null; return; }
      const commit = () => {
        if (cancelled) return;
        setAsset({ group, car });
      };
      if (visible.current) fade = gsap.to(state, { opening: .08, duration: .25, ease: 'power2.in', onUpdate: redraw, onComplete: commit });
      else commit();
    }).catch(() => { if (!cancelled) onLoadError(car.id); });
    return () => {
      cancelled = true;
      requests.cancel();
      fade?.kill();
      if (candidate && visible.current?.group !== candidate) disposeVehicle(candidate);
    };
  }, [car, state, redraw, requests, onLoadError]);
  // The old group stays mounted throughout the download. Dispose it only after
  // React commits the replacement, so there is no empty frame or scroll reset.
  useLayoutEffect(() => {
    if (!asset) return;
    visible.current = asset;
    onReady(asset.car.id);
    invalidate();
    return () => { visible.current = null; disposeVehicle(asset.group); };
  }, [asset, onReady, invalidate]);
  return asset ? <primitive object={asset.group} dispose={null} /> : null;
}

function Studio({ state, register, onError }: Pick<SceneProps, 'state' | 'register' | 'onError'>) {
  const { camera, invalidate, gl, scene, size } = useThree();
  const keyLight = useRef<DirectionalLight>(null);
  const rimLight = useRef<DirectionalLight>(null);
  const fillLight = useRef<DirectionalLight>(null);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', onError);
    // R3F intentionally loses its context on unmount; teardown is not failure.
    return () => canvas.removeEventListener('webglcontextlost', onError);
  }, [gl, onError]);

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const studio = new Scene();
    studio.background = new Color(.007, .009, .013);
    const panels: Mesh<PlaneGeometry, MeshBasicMaterial>[] = [];
    const softbox = (x: number, y: number, z: number, width: number, height: number, color: Color) => {
      const panel = new Mesh(new PlaneGeometry(width, height), new MeshBasicMaterial({ color }));
      panel.position.set(x, y, z);
      panel.lookAt(0, .5, 0);
      studio.add(panel);
      panels.push(panel);
    };
    // Authored studio strips: no downloaded HDRI, scenery, or texture requests.
    softbox(0, 5.5, 0, 1.8, 8, new Color(6, 6.5, 7));
    softbox(-5, 2.4, 0, 1.2, 7, new Color(4, 4.5, 5));
    softbox(5, 3, -2, 1.5, 6, new Color(3.5, 3.4, 3.2));
    softbox(1, 1.8, -6, 5, .45, new Color(2, .1, .055));
    const environment = pmrem.fromScene(studio, .08);
    scene.environment = environment.texture;
    invalidate();
    return () => {
      scene.environment = null;
      environment.dispose();
      panels.forEach(panel => { panel.geometry.dispose(); panel.material.dispose(); });
      pmrem.dispose();
    };
  }, [gl, scene, invalidate]);

  useEffect(() => {
    const target = new Vector3();
    const update = () => {
      camera.position.set(Math.sin(state.angle) * state.radius, state.height, Math.cos(state.angle) * state.radius);
      camera.lookAt(target.set(state.tx, state.ty, state.tz));
      if (camera instanceof PerspectiveCamera) {
        camera.fov = state.lens;
        camera.setViewOffset(size.width, size.height, state.offset * size.width, 0, size.width, size.height);
      }
      scene.environmentIntensity = .65 * state.opening;
      if (keyLight.current) {
        keyLight.current.position.set(-3 + (state.sweep + (1 - state.opening) * 1.1) * 5, 4.7, 3.5);
        keyLight.current.lookAt(0, .5, 0);
        keyLight.current.intensity = state.key * state.opening * 1.6;
      }
      if (rimLight.current) {
        rimLight.current.position.set(3, 2.4, -4);
        rimLight.current.lookAt(0, .5, 0);
        rimLight.current.intensity = state.rim * state.opening * 1.2;
      }
      if (fillLight.current) fillLight.current.intensity = .28 * state.opening;
      invalidate();
    };
    register(update);
    update();
    return () => register(() => {});
  }, [camera, invalidate, register, state, size, scene]);

  return <>
    <directionalLight ref={keyLight} color="#e4ebf4" />
    <directionalLight ref={rimLight} color="#ed493c" />
    <directionalLight ref={fillLight} position={[-4, 3, 4]} color="#d9e1ed" />
    <StudioFloor />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.028, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial color="#0c0d0f" toneMapped={false} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.008, 0]} scale={[1.25, 2.5, 1]}>
      <circleGeometry args={[1, 64]} />
      <shaderMaterial transparent depthWrite={false} uniforms={{}} vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`varying vec2 vUv; void main(){float d=length((vUv-.5)*2.);gl_FragColor=vec4(0.,0.,0.,.6*(1.-smoothstep(.2,1.,d)));}`} />
    </mesh>
  </>;
}

export default function VehicleScene(props: SceneProps) {
  const { state } = props;
  return <Canvas aria-hidden="true" frameloop="demand" dpr={[1, 1.5]}
    camera={initialCamera} gl={rendererOptions} fallback={null}>
    <Studio state={state} register={props.register} onError={props.onError} />
    <Suspense fallback={null}><Vehicle car={props.car} state={state} redraw={props.redraw} onReady={props.onReady} onLoadError={props.onLoadError} /></Suspense>
  </Canvas>;
}
