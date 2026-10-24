/* Charts that morph instead of jumping. When the scope changes (a service, a lookback, a
 * horizon), every chart tweens from the figures it was showing to the new ones: bars grow and
 * shrink, lines reshape, axes glide, numbers count. One engine for all of it, so every chart
 * moves on the same curve and the same clock.
 *
 * It tweens the data, not the DOM: each frame the chart renders the in-between figures, so
 * the drawing code stays exactly as it is. A change that arrives mid-tween starts from where
 * the chart is now, so it never snaps back. Asked for less motion, the figures change at once.
 *
 * Keyed series (weeks, services, causes) line up by key, not position: a week that's new
 * grows in from nothing and one that's gone shrinks away (`presence` goes 0 → 1 or 1 → 0),
 * so changing the lookback slides older weeks in rather than redrawing every bar. */

import { useLayoutEffect, useRef, useState } from 'react';

/** How long a morph takes, and its curve: moving on screen, so ease-in-out. */
export const MORPH_MS = 420;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Until when changes land at once instead of morphing. */
let snapUntil = 0;

/** The change about to happen came from the keyboard (J and K, ⌘K): it lands at once. Morphs
 *  are for the pointer; a key pressed again and again must never wait on one. Also stops the
 *  page's colour fades (the heatmap, the calendar) for that change, via [data-snap] on <html>. */
export function snapNextChange() {
  snapUntil = performance.now() + 120;
  document.documentElement.setAttribute('data-snap', '');
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.removeAttribute('data-snap')));
}

type Numbers = Record<string, number>;

const lerp = (a: number, b: number, t: number) => (Number.isNaN(a) || Number.isNaN(b) ? (t < 0.5 ? a : b) : a + (b - a) * t);

function mix<T extends Numbers>(from: T, to: T, t: number): T {
  const out = {} as Numbers;
  for (const k in to) out[k] = lerp(from[k] ?? to[k], to[k], t);
  return out as T;
}

/** Run `step(t)` from 0 to 1 over a morph, each frame. Returns a cancel. */
/** True while a keyboard change is landing. */
export const isSnapping = () => performance.now() < snapUntil;

function run(step: (t: number) => void) {
  if (reduced() || performance.now() < snapUntil) {
    step(1);
    return () => {};
  }
  const start = performance.now();
  let frame = requestAnimationFrame(function tick(now) {
    const t = Math.min(1, (now - start) / MORPH_MS);
    step(ease(t));
    if (t < 1) frame = requestAnimationFrame(tick);
  });
  return () => cancelAnimationFrame(frame);
}

/** A few named numbers that morph together: `{ tickets: 2332, incidents: 344 }`. */
export function useTweenedNumbers<T extends Numbers>(target: T): T {
  const [shown, setShown] = useState(target);
  const now = useRef(target);
  const key = JSON.stringify(target);
  useLayoutEffect(() => {
    const from = now.current;
    return run((t) => {
      now.current = mix(from, target, t);
      setShown(now.current);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return shown;
}

export interface Frame<T extends Numbers> {
  key: string;
  values: T;
  /** 1 when it's there; between 0 and 1 while it's arriving or leaving. */
  presence: number;
}

/** A series keyed by id (a week's start, a service's id), in order. Items that arrive grow
 *  in from zero; items that leave shrink away, then drop out. */
export function useTweenedSeries<T extends Numbers>(items: { key: string; values: T }[], order: (a: string, b: string) => number = (a, b) => a.localeCompare(b)): Frame<T>[] {
  const initial = () => items.map((i) => ({ key: i.key, values: i.values, presence: 1 }));
  const [shown, setShown] = useState<Frame<T>[]>(initial);
  const now = useRef<Frame<T>[]>(shown);
  const signature = JSON.stringify(items);
  useLayoutEffect(() => {
    const from = new Map(now.current.map((f) => [f.key, f]));
    const to = new Map(items.map((i) => [i.key, i.values]));
    const keys = [...new Set([...from.keys(), ...to.keys()])].sort(order);
    const zero = (v: T) => Object.fromEntries(Object.keys(v).map((k) => [k, 0])) as T;
    const plan = keys.map((key) => {
      const a = from.get(key);
      const b = to.get(key);
      return {
        key,
        fromValues: a ? a.values : zero(b!),
        toValues: b ?? a!.values,
        fromPresence: a ? a.presence : 0,
        toPresence: b ? 1 : 0,
      };
    });
    return run((t) => {
      now.current = plan
        .map((p) => ({ key: p.key, values: mix(p.fromValues, p.toValues, t), presence: lerp(p.fromPresence, p.toPresence, t) }))
        .filter((f) => t < 1 || f.presence > 0);
      setShown(now.current);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
  return shown;
}

/** A plain list of numbers whose length can change (a sparkline): resampled to a fixed count
 *  of points, so any two shapes can morph into each other. */
export function useTweenedShape(values: number[], points = 40): number[] {
  const resampled: Numbers = {};
  for (let i = 0; i < points; i++) {
    const x = values.length < 2 ? 0 : (i / (points - 1)) * (values.length - 1);
    const lo = Math.floor(x);
    const hi = Math.min(values.length - 1, lo + 1);
    resampled[i] = (values[lo] ?? 0) + ((values[hi] ?? 0) - (values[lo] ?? 0)) * (x - lo);
  }
  const shown = useTweenedNumbers(resampled);
  return Array.from({ length: points }, (_, i) => shown[i]);
}

/** Where each item in a keyed series sits across a width: slots sized by presence, so
 *  arriving items open up room and leaving ones close it. Returns each item's centre and
 *  width as fractions of the whole (0 to 1). */
export function slots(frames: { presence: number }[]) {
  const total = frames.reduce((n, f) => n + f.presence, 0) || 1;
  let at = 0;
  return frames.map((f) => {
    const centre = (at + f.presence / 2) / total;
    at += f.presence;
    return { centre, width: f.presence / total };
  });
}

/** Rows of a ranked list (causes, services): each row's figures morph, and the rows take the
 *  new ranking's order at once, so useFlip can slide them there. */
export function useTweenedRows<R, T extends Numbers>(rows: R[], key: (r: R) => string, figures: (r: R) => T) {
  const rank = new Map(rows.map((r, i) => [key(r), i]));
  const byKey = new Map(rows.map((r) => [key(r), r]));
  const frames = useTweenedSeries(
    rows.map((r) => ({ key: key(r), values: figures(r) })),
    (a, b) => (rank.get(a) ?? 1e9) - (rank.get(b) ?? 1e9),
  );
  return frames.map((f) => ({ ...f, row: byKey.get(f.key) }));
}
