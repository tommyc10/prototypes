/* The Depth world: where everything floats, in world units (px) around the origin. The camera
 * looks at a target point T from a distance d, tilted rx / turned ry; see camera.ts in this folder. */

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

export const Z = {
  ticket: -4200,
  wall: -4700,
  rule: -4300,
  floor: -6200,
};

/** Stars: alerts, glowing in the dark. None sit on the camera's flight path, so nothing ever
 *  passes through the lens. */
export const STARS = (() => {
  const r = rng(7);
  const out: { x: number; y: number; z: number; s: number; hot: boolean }[] = [];
  while (out.length < 240) {
    const x = (r() - 0.5) * 6400;
    const y = (r() - 0.5) * 4200;
    const z = -r() * 10000 + 900;
    const onPath = Math.abs(x) < 820 && y > -1900 && y < 520 && z < 400 && z > -7000;
    if (onPath) continue;
    out.push({ x, y, z, s: 3 + r() * 5, hot: r() < 0.12 });
  }
  return out;
})();

/* ---------- the chart wall ---------- */

export const TILE = { w: 26, h: 18 };
const PITCH_X = 32;
const PITCH_Y = 24;
const COL = 92;
export const WALL = { w: 11 * COL + PITCH_X + TILE.w, h: 11 * PITCH_Y, x: 0, y: 70 };

export const tileAt = (week: number, i: number) => ({
  x: week * COL + (i % 2) * PITCH_X,
  y: WALL.h - TILE.h - Math.floor(i / 2) * PITCH_Y,
});

export const TILES = WEEKLY.flatMap((n, w) => Array.from({ length: n }, (_, i) => ({ ...tileAt(w, i), mine: w === WEEKLY.length - 1 && i === n - 1 })));

/** Where our ticket's tile sits in the world. */
const mine = TILES.find((t) => t.mine)!;
export const MINE_WORLD = { x: WALL.x - WALL.w / 2 + mine.x + TILE.w / 2, y: WALL.y - WALL.h / 2 + mine.y + TILE.h / 2, z: Z.wall };

/* ---------- the gate on the floor ---------- */

export const LANE = { from: -560, gate: 0, pass: 400 };
