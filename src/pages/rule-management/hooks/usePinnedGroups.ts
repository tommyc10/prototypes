/* The groups a person has pinned to the sidebar, remembered in this browser.
 * With hundreds of groups the full list lives in the picker; these are the few you use daily.
 *
 * One store for the whole app: the sidebar shows the pins on every page, and the picker on
 * the Rules page changes them, so both read the same list. */

import { create } from 'zustand';
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

const usePins = create<{ pins: Pin[]; toggle: (pin: Pin) => void }>((set, get) => ({
  pins: load(),
  /** Pin a group, or unpin it if it's pinned. Past the limit, the oldest pin makes room. */
  toggle: (pin) => {
    const { pins } = get();
    const next = pins.some((p) => samePin(p, pin)) ? pins.filter((p) => !samePin(p, pin)) : [...pins, pin].slice(-MAX_PINS);
    localStorage.setItem(KEY, JSON.stringify(next));
    set({ pins: next });
  },
}));

export function usePinnedGroups() {
  const pins = usePins((s) => s.pins);
  const toggle = usePins((s) => s.toggle);
  return [pins, toggle] as const;
}

/** A pin in an address: "assignment.reactor". */
export const pinParam = (pin: Pin) => `${pin.by}.${pin.id}`;

export function pinFromParam(param: string | null | undefined): Pin | null {
  const [by, id] = (param ?? '').split('.');
  return (by === 'assignment' || by === 'service') && id ? { by, id } : null;
}
