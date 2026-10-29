'use client';
// Three.js scene mutation inside effects is intentional; these are imperative GPU objects.
/* eslint-disable react-hooks/immutability */
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PMREMGenerator, Vector3, PerspectiveCamera, Mesh, MeshStandardMaterial, type Group } from 'three';
export type CameraState = { x: number; y: number; z: number; tx: number; ty: number; tz: number; offset: number };
function Vehicle({ onReady, onError }: {onReady:()=>void; onError:()=>void}) {
  const [model, setModel] = useState<Group | null>(null);
  const { invalidate } = useThree();
  useEffect(() => {
    let disposed = false;
    let loaded: Group | null = null;
    const dispose = (group: Group) => group.traverse((o) => {
      if ('geometry' in o) (o.geometry as {dispose:()=>void}).dispose();
      if ('material' in o) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m: {dispose:()=>void}) => m.dispose());
      }
    });
    new GLTFLoader().load('/models/concept.glb', (gltf) => {
      if (disposed) { dispose(gltf.scene); return; }
      loaded = gltf.scene;
      // Satin graphite avoids sharp, chrome-like studio reflections on the bodywork.
      loaded.traverse((object) => {
        if (object instanceof Mesh) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) if (material instanceof MeshStandardMaterial) {
            if (material.name === 'Original graphite finish') {
              material.color.setRGB(.045,.05,.058); material.metalness=.5; material.roughness=.4;
            }
            if (material.name === 'Unmarked alloy') material.roughness=.38;
          }
        }
      });
      setModel(loaded); invalidate(); onReady();
    }, undefined, () => { if (!disposed) onError(); });
    return () => { disposed = true; if (loaded) dispose(loaded); };
  }, [invalidate, onReady, onError]);
  return model ? <primitive object={model} /> : null;
}
function Studio({ state, register, onError }: {state:CameraState; register:(f:()=>void)=>void; onError:()=>void}) {
  const { camera, invalidate, gl, scene, size } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', onError);
    // R3F deliberately loses its context on unmount. That is teardown, not
    // an asset failure, and must not disable the next desktop scene.
    return () => canvas.removeEventListener('webglcontextlost', onError);
  }, [gl, onError]);
  useEffect(() => {
    const target = new Vector3();
    const update = () => {
      camera.position.set(state.x,state.y,state.z);
      camera.lookAt(target.set(state.tx,state.ty,state.tz));
      if(camera instanceof PerspectiveCamera) camera.setViewOffset(size.width,size.height,state.offset*size.width,0,size.width,size.height);
      invalidate();
    };
    register(update); update();
    return () => register(() => {});
  }, [camera,invalidate,register,state,size]);
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, .04);
    scene.environment = env.texture;
    scene.environmentIntensity = .6;
    invalidate();
    return () => { scene.environment = null; env.dispose(); room.dispose(); pmrem.dispose(); };
  }, [gl,scene,invalidate]);
  return <>
    <ambientLight intensity={.35} />
    <directionalLight position={[2,6,4]} intensity={1.5} color="#e6edff" />
    <directionalLight position={[-4,3,-3]} intensity={2} color="#ffede0" />
    <pointLight position={[4,1,-3]} intensity={5} color="#ef2929" />
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,0]}>
      <planeGeometry args={[200,200]} /><meshBasicMaterial color="#0c0d0f" toneMapped={false} />
    </mesh>
  </>;
}
export default function VehicleScene({state,register,onReady,onError}: {state:CameraState; register:(f:()=>void)=>void; onReady:()=>void; onError:()=>void}) {
  return <Canvas aria-hidden="true" frameloop="demand" dpr={[1,1.5]} camera={{position:[state.x,state.y,state.z],fov:32,near:.1,far:250}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} fallback={null}>
    <Studio state={state} register={register} onError={onError}/>
    <Suspense fallback={null}><Vehicle onReady={onReady} onError={onError}/></Suspense>
  </Canvas>;
}
