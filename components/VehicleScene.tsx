'use client';
// These effects intentionally mutate imperative Three.js GPU objects.
/* eslint-disable react-hooks/immutability */
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Color, DirectionalLight, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, Vector3,
} from 'three';

// Polar coordinates keep every camera transition outside the vehicle.
export type StudioState = {
  angle: number; radius: number; height: number;
  tx: number; ty: number; tz: number; offset: number;
  key: number; rim: number; sweep: number; opening: number;
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
    new GLTFLoader().load('/models/concept.glb', gltf => {
      if (disposed) { dispose(gltf.scene); return; }
      loaded = gltf.scene;
      loaded.traverse(object => {
        if (!(object instanceof Mesh)) return;
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          if (!(material instanceof MeshStandardMaterial)) continue;
          if (material.name === 'Original graphite finish') {
            material.color.setRGB(.035, .04, .05);
            material.metalness = .64;
            material.roughness = .42;
          }
          if (material.name === 'Unmarked alloy') {
            material.color.setRGB(.16, .175, .2);
            material.metalness = .75;
            material.roughness = .4;
          }
          if (material.name === 'Opaque smoked glazing') {
            material.color.setRGB(.009, .012, .016);
            material.metalness = .3;
            material.roughness = .28;
          }
        }
      });
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
    studio.background = new Color(.025, .028, .035);
    const panels: Mesh<PlaneGeometry, MeshBasicMaterial>[] = [];
    const softbox = (x: number, y: number, z: number, width: number, height: number, color: Color) => {
      const panel = new Mesh(new PlaneGeometry(width, height), new MeshBasicMaterial({ color }));
      panel.position.set(x, y, z);
      panel.lookAt(0, .5, 0);
      studio.add(panel);
      panels.push(panel);
    };
    // Authored studio strips: no downloaded HDRI, scenery, or texture requests.
    softbox(0, 6, 0, 5, 10, new Color(12, 13, 14));
    softbox(-5, 2.4, 0, 2, 9, new Color(7, 8, 9));
    softbox(5, 3, -2, 2.5, 7, new Color(5, 4.8, 4.5));
    softbox(1, 1.8, -6, 5, .7, new Color(3, .12, .08));
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
        camera.setViewOffset(size.width, size.height, state.offset * size.width, 0, size.width, size.height);
      }
      scene.environmentIntensity = .75 * state.opening;
      if (keyLight.current) {
        keyLight.current.position.set(-3 + state.sweep * 5, 4.7, 3.5);
        keyLight.current.lookAt(0, .5, 0);
        keyLight.current.intensity = state.key * state.opening * 1.6;
      }
      if (rimLight.current) {
        rimLight.current.position.set(3, 2.4, -4);
        rimLight.current.lookAt(0, .5, 0);
        rimLight.current.intensity = state.rim * state.opening * 1.2;
      }
      if (fillLight.current) fillLight.current.intensity = .6 * state.opening;
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.028, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial color="#0c0d0f" toneMapped={false} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.024, 0]} scale={[1.15, 2.65, 1]}>
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
