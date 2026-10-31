'use client';
// These effects intentionally mutate imperative Three.js GPU objects.
/* eslint-disable react-hooks/immutability */
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { assetPath } from '@/lib/assetPath';
import StudioFloor from './StudioFloor';
import {
  type Material, Box3, Color, DirectionalLight, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial,
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
  onReady: () => void; onError: () => void;
};
// Studio owns the camera after mount. React chapter updates must not reapply a
// position sampled midway through a GSAP tween over the imperative camera.
const initialCamera = { position: [0, 2.45, 10] as [number, number, number], fov: 32, near: .1, far: 250 };
const rendererOptions = { antialias: true, alpha: true, powerPreference: 'high-performance' as const };

function Vehicle({ onReady, onError }: Pick<SceneProps, 'onReady' | 'onError'>) {
  const [model, setModel] = useState<Group | null>(null);
  const { invalidate } = useThree();
  useEffect(() => {
    let disposed = false;
    let loaded: Group | null = null;
    const dispose = (group: Group) => {
      const geometries = new Set<Mesh['geometry']>();
      const materials = new Set<MeshStandardMaterial>();
      group.traverse(object => {
        if (!(object instanceof Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
    };
    new GLTFLoader().load(assetPath('/models/concept.glb'), gltf => {
      if (disposed) { dispose(gltf.scene); return; }
      loaded = gltf.scene;
      loaded.updateMatrixWorld(true);
      // Use actual vertices: transformed bounding boxes overestimate this GLB.
      // Its authored lowest point is 0.175 above zero, which made it float.
      loaded.position.y -= new Box3().setFromObject(loaded, true).min.y;
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
      setModel(loaded);
      invalidate();
    }, undefined, () => { if (!disposed) onError(); });
    return () => { disposed = true; if (loaded) dispose(loaded); };
  }, [invalidate, onError]);
  // Ready means the model has actually committed into the scene graph.
  useEffect(() => { if (model) { invalidate(); onReady(); } }, [model, invalidate, onReady]);
  return model ? <primitive object={model} /> : null;
}

function Studio({ state, register, onError }: Omit<SceneProps, 'onReady'>) {
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
    <Suspense fallback={null}><Vehicle onReady={props.onReady} onError={props.onError} /></Suspense>
  </Canvas>;
}
