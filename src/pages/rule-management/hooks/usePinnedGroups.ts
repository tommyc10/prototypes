/* The groups a person has pinned to the sidebar, remembered in this browser.
 * With hundreds of groups the full list lives in the picker; these are the few you use daily. */

import { useState } from 'react';
import type { GroupBy } from '../model/browse';

export interface Pin {
  by: GroupBy;
  id: string;
}

const KEY = 'mn-pinned-groups';
export const MAX_PINS = 5;

export const samePin = (a: Pin, b: Pin) => a.by === b.by && a.id === b.id;

function load(): Pin[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function usePinnedGroups() {
  const [pins, setPins] = useState(load);

  /** Pin a group, or unpin it if it's pinned. Past the limit, the oldest pin makes room. */
  const toggle = (pin: Pin) => {
    const next = pins.some((p) => samePin(p, pin)) ? pins.filter((p) => !samePin(p, pin)) : [...pins, pin].slice(-MAX_PINS);
    localStorage.setItem(KEY, JSON.stringify(next));
    setPins(next);
  };

  return [pins, toggle] as const;
}
