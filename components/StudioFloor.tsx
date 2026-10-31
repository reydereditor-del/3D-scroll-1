'use client';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Color, PlaneGeometry } from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

// A small, demand-rendered reflection pass. No screen-space postprocessing or
// external textures. The local mask blends the mirror into the matte floor.
const floorShader = {
  uniforms: { color: { value: new Color('#0c0d0f') }, tDiffuse: { value: null }, textureMatrix: { value: null } },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vReflection;
    varying vec2 vFloor;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() {
      vReflection = textureMatrix * vec4(position, 1.0);
      vFloor = position.xy;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    varying vec4 vReflection;
    varying vec2 vFloor;
    #include <logdepthbuf_pars_fragment>
    void main() {
      #include <logdepthbuf_fragment>
      vec2 uv = vReflection.xy / vReflection.w;
      vec2 spread = vec2(0.0018, 0.0035);
      vec3 reflected = texture2D(tDiffuse, uv).rgb * 0.4;
      reflected += texture2D(tDiffuse, uv + spread).rgb * 0.15;
      reflected += texture2D(tDiffuse, uv - spread).rgb * 0.15;
      reflected += texture2D(tDiffuse, uv + vec2(spread.x, -spread.y)).rgb * 0.15;
      reflected += texture2D(tDiffuse, uv + vec2(-spread.x, spread.y)).rgb * 0.15;
      float fade = 1.0 - smoothstep(1.0, 5.0, length(vFloor * vec2(1.0, 0.65)));
      vec3 matte = vec3(0.0037, 0.0040, 0.0048);
      gl_FragColor = vec4(matte + reflected * 0.14 * fade, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

export default function StudioFloor() {
  const { scene, size, invalidate } = useThree();
  useEffect(() => {
    const geometry = new PlaneGeometry(24, 24);
    const width = Math.min(768, Math.max(256, Math.round(size.width / 2)));
    const height = Math.min(512, Math.max(256, Math.round(size.height / 2)));
    const floor = new Reflector(geometry, { textureWidth: width, textureHeight: height, clipBias: .003, multisample: 0, shader: floorShader });
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.012;
    scene.add(floor);
    invalidate();
    return () => { scene.remove(floor); floor.dispose(); geometry.dispose(); };
  }, [scene, size.width, size.height, invalidate]);
  return null;
}
