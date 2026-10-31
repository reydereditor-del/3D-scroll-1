'use client';
import type { CarDefinition } from '@/lib/carCatalog';

type Props = {
  cars: readonly CarDefinition[];
  activeId: string;
  requestedId: string;
  error: string;
  onSelect: (id: string) => void;
};

export default function CarSelector({ cars, activeId, requestedId, error, onSelect }: Props) {
  if (cars.length < 2) return null;
  const index = Math.max(0, cars.findIndex(car => car.id === activeId));
  const requested = cars.find(car => car.id === requestedId) ?? cars[index];
  const busy = requestedId !== activeId;
  const chooseRelative = (step: number) => onSelect(cars[(index + step + cars.length) % cars.length].id);
  return <nav className="car-selector" aria-label="Choose a car" onKeyDown={event => {
    if (busy || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    chooseRelative(event.key === 'ArrowRight' ? 1 : -1);
  }}>
    <div className="car-selector-main" aria-busy={busy}>
      <button type="button" aria-label="Previous car" onClick={() => chooseRelative(-1)} disabled={busy}>‹</button>
      <div className="car-selector-title"><span className="car-selector-count">{String(index + 1).padStart(2, '0')} / {String(cars.length).padStart(2, '0')}</span><span>{cars[index].name}</span></div>
      <button type="button" aria-label="Next car" onClick={() => chooseRelative(1)} disabled={busy}>›</button>
    </div>
    <div className="car-selector-options">{cars.map(car => <button key={car.id} type="button" aria-pressed={car.id === activeId} onClick={() => onSelect(car.id)} disabled={busy}>{car.name}</button>)}</div>
    <span className="car-selector-status" role="status">{error || (busy ? `Loading ${requested.name}…` : '')}</span>
  </nav>;
}
