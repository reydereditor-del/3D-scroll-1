import { studioPoses } from './studioDirection';
import type { StudioState } from '@/components/VehicleScene';

export type CarDefinition = {
  id: string;
  name: string;
  modelSrc: string;
  photos: readonly [string, string, string, string, string];
  poses: readonly Omit<StudioState, 'opening'>[];
  orientation: number;
  materialProfile: 'concept' | 'authored';
  credit: { label: string; url: string; license: string; licenseUrl: string };
};

// Candidates stay outside the selectable catalog until the real GLB, matching
// images, provenance, and all five camera poses have been inspected.
export const carCandidates = [
  { id: 'pagani-huayra', name: 'Pagani Huayra', source: 'https://sketchfab.com/3d-models/pagani-huayra-free-c2d61a9f53a54a229547bb76e4b71e25' },
  { id: 'porsche-gt3-rs', name: 'Porsche 911 GT3 RS', source: 'https://sketchfab.com/3d-models/porsche-911-gt3-rs-73a595bff7d5498fa1891c4a78787d26' },
  { id: 'lamborghini-revuelto', name: 'Lamborghini Revuelto', source: 'https://sketchfab.com/3d-models/lamborghini-revuelto-4258ff5b559c45f2a470344f0e04c8cd' },
] as const;

export const legacyCar: CarDefinition = {
  id: 'studio-concept', name: 'Studio Concept', modelSrc: '/models/concept.glb',
  photos: ['/images/hero.webp', '/images/design.webp', '/images/performance.webp', '/images/details.webp', '/images/hero.webp'],
  poses: studioPoses, orientation: 0, materialProfile: 'concept',
  credit: { label: 'Car Concept — Eric Chadwick / DGG, modified', url: 'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept', license: 'CC BY 4.0', licenseUrl: '/licenses/carconcept-CC-BY-4.0.txt' },
};

export const verifiedCars: readonly CarDefinition[] = [];
export const availableCars: readonly CarDefinition[] = verifiedCars.length === carCandidates.length
  ? verifiedCars : [legacyCar, ...verifiedCars];
