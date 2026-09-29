/* Where things are on the stage. The stage is a fixed 1440 × 900 canvas scaled to fit the
 * window, so layout positions (offsetLeft/Top) never change with the window size. That makes
 * every camera move and every fly-to computable once, from the DOM, at build time. */

export const STAGE_W = 1440;
export const STAGE_H = 900;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** An element's layout box relative to an ancestor. Ignores transforms, which is the point:
 *  it's where the element sits once every animation has settled. */
export function boxIn(el: HTMLElement, root: HTMLElement): Box {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export const centerOf = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** Camera: the transform (origin 0 0) that scales a full-stage layer by `scale` and puts the
 *  centre of `target` at stage point (`toX`, `toY`). */
export function focus(target: Box, scale: number, toX = STAGE_W / 2, toY = STAGE_H / 2) {
  const c = centerOf(target);
  return { x: toX - c.x * scale, y: toY - c.y * scale, scale, transformOrigin: '0 0' };
}

/** The x/y/scale that moves element box `from` onto box `to` (origin 0 0), for fly-ins and FLIPs. */
export function morph(from: Box, to: Box, uniform = true) {
  const sx = to.w / from.w;
  const sy = to.h / from.h;
  const s = uniform ? Math.min(sx, sy) : sx;
  // Centre-align when scaling uniformly so the shapes line up at their middles.
  const x = to.x + (to.w - from.w * s) / 2 - from.x;
  const y = to.y + (to.h - from.h * (uniform ? s : sy)) / 2 - from.y;
  return uniform
    ? { x, y, scale: s, transformOrigin: '0 0' }
    : { x, y, scaleX: sx, scaleY: sy, transformOrigin: '0 0' };
}
