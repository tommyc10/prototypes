/* Throwaway: the overnight suggestions the prototype shows (the same five as overnight-beam). */

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
