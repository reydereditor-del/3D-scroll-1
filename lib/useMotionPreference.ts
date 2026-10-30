'use client';

import { useSyncExternalStore } from 'react';

const preferenceKey = 'nocturne-motion';
const changeEvent = 'nocturne-motion-change';
const desktopQuery = '(min-width: 1024px)';
const reducedQuery = '(prefers-reduced-motion: reduce)';
let sessionChoice: boolean | null = null;

function readChoice() {
  if (sessionChoice !== null) return sessionChoice;
  try { return sessionStorage.getItem(preferenceKey) === 'full'; }
  catch { return false; }
}

function snapshot() {
  return `${Number(matchMedia(desktopQuery).matches)}${Number(matchMedia(reducedQuery).matches)}${Number(readChoice())}`;
}
function serverSnapshot() { return '000'; }
function subscribe(notify: () => void) {
  const desktop = matchMedia(desktopQuery);
  const reduced = matchMedia(reducedQuery);
  const stored = (event: StorageEvent) => {
    if (event.key === preferenceKey || event.key === null) { sessionChoice = null; notify(); }
  };
  desktop.addEventListener('change', notify);
  reduced.addEventListener('change', notify);
  window.addEventListener(changeEvent, notify);
  window.addEventListener('storage', stored);
  return () => {
    desktop.removeEventListener('change', notify);
    reduced.removeEventListener('change', notify);
    window.removeEventListener(changeEvent, notify);
    window.removeEventListener('storage', stored);
  };
}

export function useMotionPreference() {
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const desktop = state[0] === '1';
  const prefersReducedMotion = state[1] === '1';
  const motionOverride = desktop && state[2] === '1';
  const toggleMotion = () => {
    sessionChoice = !motionOverride;
    try {
      if (sessionChoice) sessionStorage.setItem(preferenceKey, 'full');
      else sessionStorage.removeItem(preferenceKey);
    } catch { /* The explicit choice still works when storage is unavailable. */ }
    window.dispatchEvent(new Event(changeEvent));
  };
  return { desktop, prefersReducedMotion, motionOverride, toggleMotion };
}
