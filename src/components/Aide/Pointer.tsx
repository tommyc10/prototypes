/* The aide pointing at the real page: a ring around the element, and a thin tether drawn from
 * the aide's face to it, so your eye travels from what it said to what it meant.
 *
 * The element is measured every frame while the ring shows, so it keeps up with a scroll or a
 * pane sliding open. The ring stays 2.6s, then fades. Asked for less motion, the tether
 * doesn't draw itself and the ring doesn't ripple; both simply appear and fade. */

import { useEffect, useRef, useState } from 'react';
import { gaze, lookAt, leadFace } from './eyes';
import { useAide } from './useAide';

const HOLD_MS = 2600;
const LEAVE_MS = 200;
const PAD = 6;

export function Pointer({ panelOpen, onMissing }: { panelOpen: boolean; onMissing: () => void }) {
  const point = useAide((s) => s.point);
  const [live, setLive] = useState<{ n: number; leaving: boolean } | null>(null);
  const ring = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const tip = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!point) return;
    // A page that has just opened may still be fetching what's asked for, so wait a moment.
    let tries = 0;
    let wait = 0;
    let stop = () => {};
    const find = () => {
      const el = document.querySelector<HTMLElement>(point.target);
      if (el && el.getClientRects().length) stop = pointAt(el, point.n);
      else if (++tries < 8) wait = window.setTimeout(find, 150);
      else onMissing();
    };
    find();
    return () => {
      clearTimeout(wait);
      stop();
    };
    // A new `n` is a new request, even for the same element.
  }, [point?.n]);

  function pointAt(el: HTMLElement, n: number) {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: still ? 'auto' : 'smooth' });
    setLive({ n, leaving: false });

    let frame = 0;
    const draw = () => {
      const r = el.getBoundingClientRect();
      const box = { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 };
      if (ring.current) {
        ring.current.style.transform = `translate(${box.x}px, ${box.y}px)`;
        ring.current.style.width = `${box.w}px`;
        ring.current.style.height = `${box.h}px`;
      }
      const face = leadFace(panelOpen);
      if (face && path.current && tip.current) {
        // End on the ring's edge nearest the face, not its centre.
        const ex = Math.min(Math.max(face.x, box.x), box.x + box.w);
        const ey = Math.min(Math.max(face.y, box.y), box.y + box.h);
        const mx = (face.x + ex) / 2;
        const my = (face.y + ey) / 2;
        // Bow the line a little, to one side, so it reads as thrown rather than ruled.
        const nx = -(ey - face.y) * 0.18;
        const ny = (ex - face.x) * 0.18;
        path.current.setAttribute('d', `M ${face.x} ${face.y} Q ${mx + nx} ${my + ny} ${ex} ${ey}`);
        tip.current.setAttribute('cx', `${ex}`);
        tip.current.setAttribute('cy', `${ey}`);
        lookAt(panelOpen, { x: ex, y: ey }, 60);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    gaze.busy = true;
    const leave = setTimeout(() => setLive((l) => l && { ...l, leaving: true }), HOLD_MS);
    const gone = setTimeout(() => {
      cancelAnimationFrame(frame);
      setLive(null);
      gaze.busy = false;
      lookAt(panelOpen, null);
    }, HOLD_MS + LEAVE_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(leave);
      clearTimeout(gone);
      gaze.busy = false;
    };
  }

  if (!live) return null;
  return (
    <div className="mn-aide-pointer" data-leaving={live.leaving || undefined} key={live.n} aria-hidden>
      <svg className="mn-aide-tether">
        <path ref={path} pathLength={1} />
        <circle ref={tip} r={2.5} />
      </svg>
      <div className="mn-aide-ring" ref={ring} />
    </div>
  );
}
