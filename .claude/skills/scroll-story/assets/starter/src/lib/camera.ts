/* Camera moves that go *into* things.
 *
 * portal(): the zoom that carries you from one scene into the next. The next scene is drawn as
 * if it sat inside a box on the current one (a card, a cluster, the counter of a letter). Both
 * layers are driven from one number, z (0 → 1), so they stay locked together: at z = 0 the outer
 * scene is at rest and the inner one is a miniature sitting exactly in the box; at z = 1 the inner
 * scene fills the stage and the outer one has flown off past the edges.
 *
 * Scale runs on a log curve (s = k^z), because the eye reads zoom logarithmically: a linear
 * scale tween would rush the start and crawl at the end. The zoom pivots about the one point
 * that stays put on screen, so the path is a straight dive rather than a swing.
 *
 * It's driven through a proxy tween's onUpdate with quickSetters (no tween per frame), so it
 * scrubs both ways and costs almost nothing. Layers must only be moved by their camera. */

import { gsap } from './gsap';
import { type Box, STAGE_H, STAGE_W } from './geometry';
import type { Story } from '../story/timeline/kit';

export interface Portal {
  /** Zoom factor from rest to the inner scene filling the stage. */
  k: number;
  /** The outer and inner transforms (origin 0 0) at depth z. */
  at: (z: number) => { outer: { x: number; y: number; scale: number }; inner: { x: number; y: number; scale: number } };
}

/** The maths: `target` is a box in the outer layer's own coordinates (at rest). `cover` makes the
 *  inner stage cover the box (clip it to the box's shape); otherwise it's contained in it. */
export function portalMath(target: Box, cover = true): Portal {
  const m = cover ? Math.max(target.w / STAGE_W, target.h / STAGE_H) : Math.min(target.w / STAGE_W, target.h / STAGE_H);
  const ox = target.x + target.w / 2 - (m * STAGE_W) / 2;
  const oy = target.y + target.h / 2 - (m * STAGE_H) / 2;
  const k = 1 / m;
  // The fixed point of the zoom: where on screen nothing moves.
  const px = (k * ox) / (k - 1);
  const py = (k * oy) / (k - 1);
  return {
    k,
    at(z) {
      const s = Math.pow(k, z);
      const x = px * (1 - s);
      const y = py * (1 - s);
      return { outer: { x, y, scale: s }, inner: { x: x + s * ox, y: y + s * oy, scale: s * m } };
    },
  };
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface PortalOptions {
  outer: HTMLElement;
  inner: HTMLElement;
  /** Box in the outer layer's coordinates, at rest. */
  target: Box;
  at: number;
  duration: number;
  /** 'in' zooms into target; 'out' plays it backwards (the inner shrinks back into target). */
  direction?: 'in' | 'out';
  ease?: string;
  /** z range over which the inner layer fades in (it sits on top of the outer). */
  fade?: [number, number];
  cover?: boolean;
  /** Put the layers in their starting pose now, at build time. For an inner scene that should
   *  already show as a miniature before the zoom starts (a glimpse through the letter). */
  prime?: boolean;
  /** An element inside the inner layer that fades in only as the zoom lands (z 0.8 → 1): its
   *  background, when the target is a region of the outer scene rather than an object on it.
   *  Until then the outer scene shows through, so there's no hard edge. */
  backdrop?: HTMLElement;
  /** Keep zooming the outer scene by this factor after the inner one has landed. For going
   *  *through* something (the counter of a letter): the inner is clipped to the hole, and the
   *  hole keeps growing until its edges have left the screen. onZoom sees z run past 1. */
  beyond?: number;
  /** Called every frame with z and the outer's scale, e.g. to drive a zoom readout or a clip. */
  onZoom?: (z: number, scale: number) => void;
}

/** Schedule a portal on the story's timeline. Returns the time it ends. */
export function portal(s: Story, o: PortalOptions) {
  const { outer, inner, target, at, duration, direction = 'in', ease = 'story-in-out', fade = [0.3, 0.6], cover = true, prime = false, backdrop, beyond = 1, onZoom } = o;
  const p = portalMath(target, cover);
  const far = 1 + (beyond > 1 ? Math.log(beyond) / Math.log(p.k) : 0);
  // quickSetter doesn't take the `scale` shorthand, so set both axes.
  const set = (el: HTMLElement) => {
    const sx = gsap.quickSetter(el, 'scaleX');
    const sy = gsap.quickSetter(el, 'scaleY');
    return {
      x: gsap.quickSetter(el, 'x', 'px'),
      y: gsap.quickSetter(el, 'y', 'px'),
      scale: (v: number) => (sx(v), sy(v)),
      opacity: gsap.quickSetter(el, 'opacity'),
    };
  };
  const so = set(outer);
  const si = set(inner);
  const sb = backdrop ? gsap.quickSetter(backdrop, 'opacity') : null;
  const apply = (z: number) => {
    // Past z = 1 the outer keeps going; the inner stays landed.
    const t = p.at(z);
    const ti = z > 1 ? p.at(1) : t;
    so.x(t.outer.x);
    so.y(t.outer.y);
    so.scale(t.outer.scale);
    si.x(ti.inner.x);
    si.y(ti.inner.y);
    si.scale(ti.inner.scale);
    si.opacity(smooth(fade[0], fade[1], z));
    sb?.(smooth(0.8, 1, z));
    onZoom?.(z, t.outer.scale);
  };
  gsap.set([outer, inner], { transformOrigin: '0 0' });
  if (prime) apply(direction === 'in' ? 0 : far);
  const proxy = { z: direction === 'in' ? 0 : far };
  const end = direction === 'in' ? far : 0;
  // Both layers are on screen for the whole move; whichever isn't the destination hides after.
  s.tl.set([outer, inner], { visibility: 'visible' }, at);
  s.tl.to(proxy, {
    z: end,
    duration,
    ease,
    immediateRender: false,
    onStart: () => apply(proxy.z),
    onUpdate: () => apply(proxy.z),
    onComplete: () => apply(end),
    onReverseComplete: () => apply(direction === 'in' ? 0 : far),
  }, at);
  s.tl.set(direction === 'in' ? outer : inner, { visibility: 'hidden' }, at + duration);
  return at + duration;
}
