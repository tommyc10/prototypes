/* The toolkit the chapters are written with. One master timeline, scrubbed by scroll.
 *
 * Conventions every chapter follows:
 * - The DOM is drawn in its END state. A chapter first `gsap.set`s the starting state
 *   (so it can be reverted cleanly), then only ever tweens forward with `tl.to`.
 * - `.to` reads its start values lazily, the first time the playhead reaches it, so
 *   tweens on the same element can be chained across chapters and still scrub backwards.
 * - Positions are plain numbers (timeline seconds). One second ≈ a quarter of a screen of scroll.
 * - Eases: `mn-out` to enter or leave, `mn-in-out` for anything travelling on screen,
 *   `none` for clocks, typing and conveyor belts. */

import { gsap, SplitText } from '../../lib/gsap';
import { type Box, boxIn, centerOf } from '../../lib/geometry';

export interface Mark {
  id: string;
  start: number;
  end: number;
}

export interface Story {
  tl: gsap.core.Timeline;
  stage: HTMLElement;
  /** Chapter spans, for the progress rail. */
  marks: Mark[];
  /** Time at which the chapter being written starts. Chapters move it forward. */
  t: number;
}

export function createStory(stage: HTMLElement): Story {
  return {
    tl: gsap.timeline({ paused: true, defaults: { ease: 'mn-out', duration: 0.6 } }),
    stage,
    marks: [],
    t: 0,
  };
}

/* ---------- finding things ---------- */

export function one(s: Story, sel: string) {
  const el = s.stage.querySelector<HTMLElement>(sel);
  if (!el) throw new Error(`story: nothing matches ${sel}`);
  return el;
}

export const all = (s: Story, sel: string) => Array.from(s.stage.querySelectorAll<HTMLElement>(sel));

/** Where an element sits on the stage once everything has settled. */
export const box = (s: Story, el: HTMLElement | string) => boxIn(typeof el === 'string' ? one(s, el) : el, s.stage);

/* ---------- captions ---------- */

const splits = new WeakMap<HTMLElement, SplitText>();

/** Hide a chapter caption and split its title into masked lines, ready to rise. */
export function prepareCaption(s: Story, id: string) {
  const cap = one(s, `[data-cap="${id}"]`);
  const title = cap.querySelector<HTMLElement>('.cap-title')!;
  const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'cap-line' });
  splits.set(cap, split);
  gsap.set(cap, { autoAlpha: 0 });
  gsap.set(split.lines, { yPercent: 105 });
  gsap.set(cap.querySelectorAll('.cap-fade, .cap-aside'), { autoAlpha: 0, y: 10 });
}

export function captionIn(s: Story, id: string, at: number) {
  const cap = one(s, `[data-cap="${id}"]`);
  const split = splits.get(cap)!;
  s.tl.set(cap, { autoAlpha: 1, y: 0, filter: 'blur(0px)' }, at);
  s.tl.to(split.lines, { yPercent: 0, duration: 0.8, stagger: 0.08 }, at);
  s.tl.to(cap.querySelectorAll('.cap-fade'), { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1 }, at + 0.15);
  return at + 0.9;
}

export function captionOut(s: Story, id: string, at: number) {
  const cap = one(s, `[data-cap="${id}"]`);
  s.tl.to(cap, { autoAlpha: 0, y: -12, filter: 'blur(4px)', duration: 0.45 }, at);
  return at + 0.45;
}

/** Record a chapter's span for the rail. */
export function mark(s: Story, id: string, start: number, end: number) {
  s.marks.push({ id, start, end });
  s.tl.addLabel(id, start);
}

/* ---------- small motions ---------- */

/** Fade and lift into place. Sets the hidden state now; plays at `at`. */
export function enter(
  s: Story,
  targets: gsap.TweenTarget,
  at: number,
  { y = 12, x = 0, scale = 1, stagger = 0.06, duration = 0.6, blur = 0 } = {},
) {
  const soft = blur ? { filter: `blur(${blur}px)` } : {};
  const sharp = blur ? { filter: 'blur(0px)' } : {};
  gsap.set(targets, { autoAlpha: 0, y, x, scale, ...soft });
  s.tl.to(targets, { autoAlpha: 1, y: 0, x: 0, scale: 1, ...sharp, stagger, duration }, at);
}

/** Leave: fade, drift, soften. Exits are quicker than entrances. */
export function leave(s: Story, targets: gsap.TweenTarget, at: number, { y = -8, scale = 1, duration = 0.4, blur = 4 } = {}) {
  s.tl.to(targets, { autoAlpha: 0, y, scale, ...(blur ? { filter: `blur(${blur}px)` } : {}), duration }, at);
}

/** Two elements in the same spot: dissolve one into the other, with a touch of blur to hide the seam. */
export function swap(s: Story, from: HTMLElement | HTMLElement[], to: HTMLElement | HTMLElement[], at: number, duration = 0.35) {
  gsap.set(from, { autoAlpha: 1, filter: 'blur(0px)' });
  gsap.set(to, { autoAlpha: 0, filter: 'blur(3px)' });
  s.tl.to(from, { autoAlpha: 0, filter: 'blur(3px)', duration }, at);
  s.tl.to(to, { autoAlpha: 1, filter: 'blur(0px)', duration }, at + duration * 0.3);
}

/** Count a number up in place. The element holds only the digits. */
export function count(s: Story, el: HTMLElement, at: number, duration = 0.8, from = 0, ease = 'power2.out') {
  const to = Number(el.textContent);
  gsap.set(el, { textContent: from });
  s.tl.to(el, { textContent: to, snap: { textContent: 1 }, duration, ease }, at);
}

/** Type text into an element at a steady pace. */
export function type(s: Story, el: HTMLElement, text: string, at: number, duration: number) {
  gsap.set(el, { text: '' });
  s.tl.to(el, { text: { value: text }, duration, ease: 'none' }, at);
}

/** A quick press: scale down and back, the way a button answers a click. */
export function press(s: Story, el: HTMLElement, at: number) {
  s.tl.to(el, { keyframes: [{ scale: 0.96, duration: 0.08 }, { scale: 1, duration: 0.18 }], ease: 'mn-out' }, at);
}

/* ---------- the pointer ---------- */

export interface Pointer {
  /** Appear at a point (tip position). */
  show: (at: number, to: { x: number; y: number }) => void;
  /** Travel so the tip lands on the centre of a box (or a point). */
  move: (at: number, to: Box | { x: number; y: number }, duration?: number) => void;
  /** Press at the tip's current target, pressing `button` too. */
  click: (at: number, target: Box, button?: HTMLElement) => void;
  hide: (at: number) => void;
}

export function pointer(s: Story, scene: string): Pointer {
  const el = one(s, `${scene} .cursor`);
  const ring = one(s, `${scene} .cursor-ring`);
  // The arrow's tip is at (3, 2) inside the SVG.
  gsap.set(el, { autoAlpha: 0, transformOrigin: '3px 2px' });
  gsap.set(ring, { autoAlpha: 0 });
  const tip = (p: Box | { x: number; y: number }) => ('w' in p ? centerOf(p) : p);
  return {
    show(at, to) {
      s.tl.set(el, { x: to.x - 3, y: to.y - 2 }, at);
      s.tl.to(el, { autoAlpha: 1, duration: 0.2 }, at);
    },
    move(at, to, duration = 0.7) {
      const p = tip(to);
      s.tl.to(el, { x: p.x - 3, y: p.y - 2, duration, ease: 'mn-in-out' }, at);
    },
    click(at, target, button) {
      const p = centerOf(target);
      s.tl.to(el, { keyframes: [{ scale: 0.86, duration: 0.08 }, { scale: 1, duration: 0.16 }], ease: 'mn-out' }, at);
      s.tl.set(ring, { x: p.x, y: p.y, scale: 0.4, autoAlpha: 0.9 }, at);
      s.tl.to(ring, { scale: 1.35, autoAlpha: 0, duration: 0.5 }, at);
      if (button) press(s, button, at);
    },
    hide(at) {
      s.tl.to(el, { autoAlpha: 0, duration: 0.25 }, at);
    },
  };
}
