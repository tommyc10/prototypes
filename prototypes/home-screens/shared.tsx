/* Throwaway: what every home screen shares. The words (the greeting, the figure, the one
 * thing waiting), a canvas that redraws every frame from the theme's own tokens, and a
 * record of which alerts have just arrived. */

import { useEffect, useRef, type RefObject } from 'react';
import type { Theme } from '../../src/hooks/useTheme';
import { num } from '../../src/lib/format';
import { CURRENT_USER } from '../../src/pages/rule-management/data/mockData';
import { clockFace, dayFace, TONE_COLOR, type Need, type Station } from '../../src/pages/home/model/station';

/** What every variant is given. The harness owns the queue; a variant only shows it. */
export interface HomeProps {
  data: Station;
  /** Which thing in the queue is showing. */
  at: number;
  need?: Need;
  step: (by: number) => void;
  /** Show the first thing waiting for this group, if there is one. */
  pickGroup: (groupId: string) => void;
  theme: Theme;
}

export const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- the words ---------- */

export function Hello({ now }: { now: number }) {
  const hour = new Date(now).getHours();
  const hello = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${CURRENT_USER.split(' ')[0]}.`;
  return (
    <header className="hm-head">
      <p className="hm-date">
        {dayFace(now)} <span className="mn-mono">{clockFace(now)}</span>
      </p>
      <h1>{hello}</h1>
    </header>
  );
}

export function Lead({ data }: { data: Station }) {
  const { counts } = data;
  return (
    <p className="hm-lead">
      {counts.paged === 1 ? 'alert' : 'alerts'} reached a person in the last hour, out of <b>{num(counts.total)}</b>. Rules hid <b>{num(counts.hidden)}</b>,
      and <b>{num(counts.folded)}</b> joined incidents that were already open.
    </p>
  );
}

export function Figure({ data }: { data: Station }) {
  return (
    <a className="hm-num" href="#/alerts" aria-label={`${data.counts.paged} alerts reached a person. Open the alert stream.`}>
      {num(data.counts.paged)}
    </a>
  );
}

export function NeedBlock({ data, at, need }: Pick<HomeProps, 'data' | 'at' | 'need'>) {
  const { queue } = data;
  return (
    <section className="hm-need" aria-live="polite">
      {need ? (
        <>
          <p className="hm-need-count">{queue.length === 1 ? 'One thing is waiting on you' : `${at + 1} of ${queue.length} waiting on you`}</p>
          <a className="hm-need-row" href={need.href}>
            <i style={{ background: TONE_COLOR[need.tone] }} aria-hidden />
            <span className="hm-need-main">
              <span className="hm-need-title">
                {need.title} <span className="hm-need-kind">{need.kind}</span>
              </span>
              <span className="hm-need-why">{need.why}</span>
            </span>
            <kbd>↵</kbd>
          </a>
        </>
      ) : (
        <p className="hm-need-count">Nothing is waiting on you.</p>
      )}
    </section>
  );
}

export function Keys({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return (
    <footer className="hm-keys hs-keys">
      <span>
        <kbd>J</kbd> <kbd>K</kbd> Next thing
      </span>
      <span>
        <kbd>↵</kbd> Open it
      </span>
    </footer>
  );
}

/* ---------- the theme, for a canvas ---------- */

export interface Ink {
  fg: string;
  fg2: string;
  fg3: string;
  tone1: string;
  tone2: string;
  tone3: string;
  tone4: string;
  line: string;
  line2: string;
  line3: string;
  l2: string;
  l3: string;
  red: string;
  orange: string;
  amber: string;
  green: string;
}

const NAMES: Record<keyof Ink, string> = {
  fg: '--fg',
  fg2: '--fg-2',
  fg3: '--fg-3',
  tone1: '--tone-1',
  tone2: '--tone-2',
  tone3: '--tone-3',
  tone4: '--tone-4',
  line: '--line',
  line2: '--line-2',
  line3: '--line-3',
  l2: '--l2',
  l3: '--l3',
  red: '--red',
  orange: '--orange',
  amber: '--amber',
  green: '--green',
};

function readInk(el: Element): Ink {
  const css = getComputedStyle(el);
  return Object.fromEntries(Object.entries(NAMES).map(([key, name]) => [key, css.getPropertyValue(name).trim()])) as unknown as Ink;
}

export const TONE_INK = { bad: 'red', warn: 'orange', plain: 'amber' } as const;

export const FONT = "'Geist Variable', ui-sans-serif, system-ui, sans-serif";
export const MONO = "'Geist Mono Variable', ui-monospace, monospace";

/** A canvas that fills its box and calls `draw` every frame (once per change, with reduced
 *  motion). The colours come from the theme and are read again when it switches. */
export function useCanvas(
  ref: RefObject<HTMLCanvasElement | null>,
  draw: (ctx: CanvasRenderingContext2D, size: { w: number; h: number }, t: number, ink: Ink) => void,
) {
  const live = useRef(draw);
  live.current = draw;

  useEffect(() => {
    const el = ref.current!;
    const ctx = el.getContext('2d')!;
    let ink = readInk(el);
    let w = 0;
    let h = 0;
    let raf = 0;
    const paint = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      live.current(ctx, { w, h }, t, ink);
    };
    const size = () => {
      const ratio = window.devicePixelRatio || 1;
      w = el.clientWidth;
      h = el.clientHeight;
      el.width = Math.round(w * ratio);
      el.height = Math.round(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint(performance.now());
    };
    const resize = new ResizeObserver(size);
    resize.observe(el);
    const theme = new MutationObserver(() => {
      ink = readInk(el);
      paint(performance.now());
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mn-theme'] });
    size();

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      paint(t);
    };
    if (!still()) raf = requestAnimationFrame(loop);
    // With reduced motion, the picture still changes when the data does: the caller redraws.
    (el as HTMLCanvasElement & { repaint?: () => void }).repaint = () => paint(performance.now());
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      theme.disconnect();
    };
  }, [ref]);
}

/** Redraw a still canvas when what it shows changes (only matters with reduced motion). */
export function useRepaint(ref: RefObject<HTMLCanvasElement | null>, deps: unknown[]) {
  useEffect(() => {
    if (still()) (ref.current as (HTMLCanvasElement & { repaint?: () => void }) | null)?.repaint?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** When each alert arrived on screen, in performance.now() time. Alerts already there when
 *  the page opened are not in it, except the latest few, which arrive one after another so
 *  the page shows how it moves. */
export function useArrivals(data: Station, standIns = 6) {
  const born = useRef(new Map<string, number>());
  const seen = useRef<number | null>(null);
  useEffect(() => {
    const t = performance.now();
    if (seen.current === null) {
      data.alerts.slice(-standIns).forEach((a, i) => born.current.set(a.id, t + 400 + i * 260));
    } else {
      for (const a of data.alerts) if (a.at > seen.current) born.current.set(a.id, t);
    }
    seen.current = data.alerts.length ? data.alerts[data.alerts.length - 1].at : data.now;
  }, [data.alerts, data.now, standIns]);
  return born;
}

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
