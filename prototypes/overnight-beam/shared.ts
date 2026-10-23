/* Throwaway: shared data and geometry for the overnight-beam prototype. */

import type { RefObject } from 'react';

export interface Suggestion {
  id: string;
  name: string;
  group: string;
  confidence: number;
  incidents: number;
  /** Real incidents this pattern would have hidden. */
  hides: number;
}

export const SUGGESTIONS: Suggestion[] = [
  { id: 'SUG-1', name: 'Hangar bay 2 magnetic shield flicker', group: 'TIE Hangar Ops', confidence: 0.96, incidents: 46, hides: 0 },
  { id: 'SUG-2', name: 'Garbage chute 5 hatch sensor duplicates', group: 'Facilities', confidence: 0.93, incidents: 38, hides: 0 },
  { id: 'SUG-3', name: 'Shield generator phase drift during rotation', group: 'Reactor Core', confidence: 0.71, incidents: 22, hides: 1 },
  { id: 'SUG-4', name: 'Docking tractor lock retries that pass', group: 'Tractor Beam Ops', confidence: 0.88, incidents: 17, hides: 0 },
  { id: 'SUG-5', name: 'Deck 9 replicator temperature warnings', group: 'Life Support', confidence: 0.64, incidents: 12, hides: 2 },
];

export const NIGHT_TOTAL = 214;

/** What every variant's light is given. The card is the positioned element it travels round. */
export interface BeamProps {
  card: RefObject<HTMLDivElement | null>;
  all: Suggestion[];
  open: Suggestion[];
  selectedId: string | null;
  /** Goes up by one each time a suggestion is proposed or dismissed. */
  handled: number;
  collapsed: boolean;
}

/* `offset-path: border-box` starts where the top edge's straight run begins, (r, 0), and runs
 * clockwise. These turn a point on the card's edge into a fraction of that trip. */
export function ring(card: HTMLElement) {
  const w = card.offsetWidth;
  const h = card.offsetHeight;
  const r = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0;
  const top = w - 2 * r;
  const side = h - 2 * r;
  const arc = (Math.PI * r) / 2;
  const length = 2 * top + 2 * side + 4 * arc;
  return {
    length,
    top: (x: number) => (x - r) / length,
    right: (y: number) => (top + arc + (y - r)) / length,
    left: (y: number) => (2 * top + side + 3 * arc + (h - r - y)) / length,
  };
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
