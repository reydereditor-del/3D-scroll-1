import type { StudioState } from '@/components/VehicleScene';

// Approved direction: one dark automotive studio, five existing story beats.
// Camera motion finishes before each text hold. Angles are unwrapped so the
// final detail move stays outside the body rather than cutting through it.
export const chapterTimes = [0, 2.05, 3.95, 5.9];
export const storyDuration = 7.4;
export const moves = [
  { start: .65, duration: .95, text: 1.42 },
  { start: 2.45, duration: 1.05, text: 3.30 },
  { start: 4.35, duration: 1.1, text: 5.23 },
];
export const studioPoses: Omit<StudioState, 'opening'>[] = [
  { angle: .62, radius: 9.8, height: 2.05, tx: 0, ty: .55, tz: 0, offset: -.22, lens: 31, key: .8, rim: .6, sweep: -.65 },
  { angle: 1.52, radius: 11, height: 1.55, tx: 0, ty: .52, tz: 0, offset: -.19, lens: 29, key: .95, rim: .4, sweep: .6 },
  { angle: 3.85, radius: 9.5, height: 1.25, tx: 0, ty: .5, tz: -.2, offset: .2, lens: 33, key: .6, rim: 1.1, sweep: -.2 },
  { angle: 6.95, radius: 5.1, height: 1.15, tx: .55, ty: .52, tz: 1.2, offset: -.24, lens: 30, key: .95, rim: .45, sweep: .75 },
  { angle: 6.95, radius: 10.5, height: 2.2, tx: 0, ty: .55, tz: 0, offset: -.08, lens: 31, key: .8, rim: .6, sweep: -.65 },
];
