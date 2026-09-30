/* The Zoom world: a board of assignment-group cards, every open alert a dot inside its
 * group's card. Positions are stage pixels on the layer they belong to, generated the same
 * way every time. */

import type { Box } from '../../lib/geometry';
import { WEEKLY } from '../../shared/story';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cards have the stage's own aspect (1.6), so any of them can be zoomed into exactly. */
export const CARD = { w: 240, h: 150 };
const COLS = [300, 580, 860, 1140];
const ROWS = [150, 360, 570];
const slot = (c: number, r: number): Box => ({ x: COLS[c], y: ROWS[r], ...CARD });

/** Where dots go inside a card: under its header. */
const inner = (b: Box) => ({ x: b.x + 16, y: b.y + 42, w: b.w - 32, h: b.h - 56 });

export interface Dot {
  x: number;
  y: number;
  /** A real incident: stays lit when the board goes quiet. */
  signal?: boolean;
}

export interface Group {
  id: string;
  name: string;
  count: number;
  box: Box;
  dots: Dot[];
  /** Gets a rule of its own in the ending. */
  ruled?: boolean;
}

const SPECS: { id: string; name: string; count: number; at: [number, number]; ruled?: boolean; shown: number; signals?: number }[] = [
  { id: 'tractor', name: 'Tractor Beam Ops', count: 214, at: [2, 1], shown: 214 },
  { id: 'hangar', name: 'TIE Hangar Ops', count: 289, at: [1, 0], ruled: true, shown: 120 },
  { id: 'facilities', name: 'Facilities', count: 167, at: [3, 0], ruled: true, shown: 96 },
  { id: 'armory', name: 'Armory & Logistics', count: 121, at: [0, 1], ruled: true, shown: 80 },
  { id: 'lifesupport', name: 'Life Support', count: 97, at: [1, 2], ruled: true, shown: 70 },
  { id: 'holonet', name: 'HoloNet Comms', count: 88, at: [3, 1], shown: 60, signals: 1 },
  { id: 'reactor', name: 'Reactor Core', count: 38, at: [2, 0], shown: 38, signals: 1 },
  { id: 'detention', name: 'Detention AA-23', count: 27, at: [3, 2], shown: 27, signals: 1 },
  { id: 'hyperdrive', name: 'Hyperdrive', count: 15, at: [0, 0], shown: 15, signals: 1 },
  { id: 'docking', name: 'Docking Bay 327', count: 54, at: [1, 1], shown: 54, signals: 1 },
];

/** The alert we follow. */
export const ME = { x: 1010, y: 448 };

export const GROUPS: Group[] = SPECS.map((g, gi) => {
  const r = rng(700 + gi * 53);
  const box = slot(...g.at);
  const a = inner(box);
  const dots: Dot[] = [];
  const n = g.id === 'tractor' ? g.shown - 1 : g.shown;
  while (dots.length < n) {
    const x = a.x + r() * a.w;
    const y = a.y + r() * a.h;
    if (g.id === 'tractor' && Math.hypot(x - ME.x, y - ME.y) < 8) continue;
    dots.push({ x, y });
  }
  for (let i = 0; i < (g.signals ?? 0); i++) dots[(i * 11 + 3) % dots.length].signal = true;
  return { id: g.id, name: g.name, count: g.count, box, dots, ruled: g.ruled };
});

export const TRACTOR = GROUPS[0];
export const TRACTOR_BOX = TRACTOR.box;
/** Board → group-view scale. */
export const CLUSTER_ZOOM = 1440 / CARD.w;

/** Where the approved rule lands on the board: the free slot under its group. */
export const MARKER: Box = slot(2, 2);

/** New alerts that arrive after the rule is live, inside the tractor card. The hot one is
 *  the same coupling over the line. */
export const NEW_DOTS = [
  { x: 902, y: 420 },
  { x: 1064, y: 470 },
  { x: 950, y: 488 },
  { x: 1040, y: 414 },
];
export const HOT = { x: 890, y: 478 };

/* ---------- the group up close (layer 1) ---------- */

const toGroup = (x: number, y: number) => ({ x: (x - TRACTOR_BOX.x) * CLUSTER_ZOOM, y: (y - TRACTOR_BOX.y) * CLUSTER_ZOOM });

/** Our alert, drawn in the group view as a tiny page (a miniature of layer 2). */
const meG = toGroup(ME.x, ME.y);
export const ME_CARD: Box = { x: meG.x - 36, y: meG.y - 22.5, w: 72, h: 45 };

/** The weekly chart the group's dots rearrange into. */
const CELL_SIZE = 10;
const PITCH = 14;
const COL = 64;
const CHART = { x: 600, base: 720 };
export const CELL = CELL_SIZE;

const cellAt = (week: number, i: number) => ({
  x: CHART.x + week * COL + (i % 2) * PITCH,
  y: CHART.base - CELL_SIZE - Math.floor(i / 2) * PITCH,
});

/** Every other dot: where it floats in the cloud, and its cell in the chart, poured in left
 *  to right. The last cell is ours. */
const cells = WEEKLY.flatMap((n, w) => Array.from({ length: n }, (_, i) => cellAt(w, i)));
export const ME_CELL = cells.pop()!;
export const CLOUD = TRACTOR.dots
  .map((d) => toGroup(d.x, d.y))
  .sort((a, b) => a.x - b.x)
  .map((p, i) => ({ ...p, cell: cells[i] }));

/* ---------- the engine, off to the right of the group view ---------- */

/** The proposed rule, drawn as a miniature of its page (layer 3), in pan coordinates. */
export const RULE_CARD: Box = { x: 1960, y: 250, w: 640, h: 400 };
/** How far the group view pans to bring the rule into frame. */
export const PAN = -1300;
