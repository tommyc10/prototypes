/* The station as a sphere you can turn, with every assignment group a point on it. A point
 * is as big as the pages it sent people this hour, and wears a ring of status colour when
 * something of its is waiting. Alerts flash where they land; one that reaches a person sends
 * a line out from the surface.
 *
 * It is drawn on a canvas, every frame, with its own small 3D projection (there is no 3D
 * library here). Whoever uses it owns which group is picked. */

import { useEffect, useRef } from 'react';
import { useHalloween } from '../../../../hooks/useHalloween';
import type { Theme } from '../../../../hooks/useTheme';
import type { Outcome } from '../../../alerts/model/types';
import { toneOf, type Station as StationData } from '../../model/station';
import './Station.css';

/** Where each group sits on the sphere: latitude and longitude, in degrees. */
const PLACES: Record<string, [number, number]> = {
  reactor: [10, 0],
  tractor: [-24, 36],
  facilities: [36, 76],
  detention: [-38, 112],
  lifesupport: [22, 152],
  hyperdrive: [-14, 198],
  hangar: [44, 238],
  holonet: [-32, 282],
  armory: [18, 322],
};

const RAD = Math.PI / 180;
const TILT = 0.32; // how far the sphere leans toward you when nothing is picked

type Vec = [number, number, number];
const onSphere = (lat: number, lon: number): Vec => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];

/** The surface: points spread evenly over the sphere, and a trench around its middle. */
const SURFACE: Vec[] = (() => {
  const points: Vec[] = [];
  const count = 1100;
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const lon = i * Math.PI * (3 - Math.sqrt(5));
    const r = Math.sqrt(1 - y * y);
    if (Math.abs(y) > 0.035) points.push([r * Math.sin(lon), y, r * Math.cos(lon)]);
  }
  return points;
})();
const TRENCH: Vec[] = Array.from({ length: 220 }, (_, i) => onSphere(0, (i / 220) * Math.PI * 2));

interface Flash {
  groupId: string;
  outcome: Outcome;
  /** When it starts, in performance.now() time. */
  at: number;
}

export function Station({
  data,
  theme,
  pickedId,
  hoverId,
  onPick,
  onHover,
}: {
  data: StationData;
  theme: Theme;
  /** The group the sphere turns to face. With none, it turns slowly by itself. */
  pickedId: string | null;
  hoverId: string | null;
  /** A point was clicked (its id), or the sphere was clicked or dragged away from one (null). */
  onPick: (id: string | null) => void;
  onHover: (id: string | null) => void;
}) {
  const halloween = useHalloween(); // Halloween mode changes the colours too
  const canvas = useRef<HTMLCanvasElement>(null);

  // The drawing loop reads these, so it never has to restart when the page re-renders.
  const live = useRef({ data, pickedId, hoverId, onPick, onHover });
  live.current = { data, pickedId, hoverId, onPick, onHover };
  const flashes = useRef<Flash[]>([]);
  const seen = useRef<number | null>(null);

  // Each alert that arrives flashes on its group. The first time, the latest few stand in.
  useEffect(() => {
    const t = performance.now();
    if (seen.current === null) {
      data.alerts.slice(-8).forEach((a, i) => flashes.current.push({ groupId: a.groupId, outcome: a.outcome, at: t + 500 + i * 180 }));
    } else {
      for (const a of data.alerts) if (a.at > seen.current) flashes.current.push({ groupId: a.groupId, outcome: a.outcome, at: t });
    }
    seen.current = data.alerts.length ? data.alerts[data.alerts.length - 1].at : data.now;
  }, [data.alerts, data.now]);

  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext('2d')!;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const css = getComputedStyle(el);
    const ink = (name: string) => css.getPropertyValue(name).trim();
    const colors = { fg: ink('--fg'), fg2: ink('--fg-2'), fg3: ink('--fg-3'), bad: ink('--red'), warn: ink('--orange'), plain: ink('--amber') };

    let width = 0;
    let height = 0;
    const size = () => {
      const ratio = window.devicePixelRatio || 1;
      width = el.clientWidth;
      height = el.clientHeight;
      el.width = Math.round(width * ratio);
      el.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    size();
    const observer = new ResizeObserver(size);
    observer.observe(el);

    // The view: how far the sphere is turned (yaw) and leaned (pitch), and how fast it's still turning.
    let yaw = -0.5;
    let pitch = TILT;
    let spin = 0;
    let drag: { x: number; y: number; moved: number } | null = null;
    let nodes: { id: string; x: number; y: number; front: boolean }[] = [];
    let last = performance.now();
    const born = last;

    const geometry = () => {
      return { cx: width / 2, cy: height / 2 + 8, radius: Math.max(90, Math.min(width, height) * 0.36) };
    };

    const project = ([x, y, z]: Vec, cx: number, cy: number, radius: number) => {
      const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
      const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
      const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
      const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
      const scale = 3.4 / (3.4 - z2); // nearer is a little bigger
      return { x: cx + x1 * radius * scale, y: cy - y2 * radius * scale, z: z2, scale };
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const { data, pickedId, hoverId } = live.current;
      const { cx, cy, radius } = geometry();

      // Turn: toward the picked group, or with what's left of a drag, or slowly by itself.
      const place = pickedId ? PLACES[pickedId] : undefined;
      if (drag) {
        // the pointer is in charge
      } else if (place) {
        const wantYaw = -place[1] * RAD;
        const turn = Math.atan2(Math.sin(wantYaw - yaw), Math.cos(wantYaw - yaw)); // the short way round
        const ease = still ? 1 : 1 - Math.exp(-dt * 7);
        yaw += turn * ease;
        pitch += (place[0] * RAD * 0.8 + 0.1 - pitch) * ease;
        spin = 0;
      } else {
        yaw += spin * dt;
        spin *= Math.exp(-dt * 2.4);
        if (!still && !hoverId) yaw += 0.07 * dt;
        pitch += (TILT - pitch) * (1 - Math.exp(-dt * 2));
      }

      ctx.clearRect(0, 0, width, height);
      // It fades up as it arrives.
      const arrive = still ? 1 : Math.min(1, (t - born) / 420);
      const shown = 1 - Math.pow(1 - arrive, 3);

      // The surface. Points on the far side show through, faintly, so it reads as a sphere.
      ctx.fillStyle = colors.fg;
      for (const point of SURFACE) {
        const p = project(point, cx, cy, radius);
        ctx.globalAlpha = (p.z > 0 ? 0.2 + p.z * 0.6 : 0.09) * shown;
        ctx.fillRect(p.x - 0.8 * p.scale, p.y - 0.8 * p.scale, 1.6 * p.scale, 1.6 * p.scale);
      }
      for (const point of TRENCH) {
        const p = project(point, cx, cy, radius);
        ctx.globalAlpha = (p.z > 0 ? 0.7 : 0.14) * shown;
        ctx.fillRect(p.x - 0.8, p.y - 0.8, 1.6, 1.6);
      }

      // The groups.
      ctx.font = "500 12px 'Geist Variable', ui-sans-serif, system-ui, sans-serif";
      ctx.textBaseline = 'middle';
      nodes = [];
      const drawn = data.groups
        .map((g) => {
          const [lat, lon] = PLACES[g.group.id] ?? [0, 0];
          const normal = onSphere(lat * RAD, lon * RAD);
          return { g, normal, p: project(normal, cx, cy, radius) };
        })
        .sort((a, b) => a.p.z - b.p.z);

      for (const { g, normal, p } of drawn) {
        const id = g.group.id;
        const front = p.z > 0;
        nodes.push({ id, x: p.x, y: p.y, front });
        const near = Math.max(0, p.z);
        const alpha = (front ? 0.35 + near * 0.65 : 0.1) * shown;
        const r = (2.6 + Math.sqrt(g.paged) * 1.25) * p.scale;
        const tone = toneOf(g);

        if (front) {
          // Alerts landing here, and pages going out.
          for (const flash of flashes.current) {
            if (flash.groupId !== id) continue;
            const age = (t - flash.at) / (flash.outcome === 'paged' ? 1100 : 700);
            if (age < 0 || age > 1 || still) continue;
            const out = 1 - Math.pow(1 - age, 3);
            ctx.globalAlpha = (1 - age) * alpha * (flash.outcome === 'hidden' ? 0.35 : flash.outcome === 'folded' ? 0.6 : 1);
            ctx.strokeStyle = flash.outcome === 'hidden' ? colors.fg3 : colors.fg;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r + out * (flash.outcome === 'paged' ? 22 : 12), 0, Math.PI * 2);
            ctx.stroke();
            if (flash.outcome === 'paged') {
              const tip = project([normal[0] * (1 + out * 0.34), normal[1] * (1 + out * 0.34), normal[2] * (1 + out * 0.34)], cx, cy, radius);
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(tip.x, tip.y);
              ctx.stroke();
            }
          }
        }

        // The point is ink, as big as its pages; what's waiting is a ring of status colour round it.
        ctx.globalAlpha = alpha;
        ctx.fillStyle = colors.fg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        if (tone) {
          ctx.strokeStyle = colors[tone];
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 3.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (front && (id === pickedId || id === hoverId)) {
          ctx.strokeStyle = colors.fg;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = id === pickedId ? shown : 0.5 * shown;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 8, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (front) {
          const strong = id === pickedId || id === hoverId;
          ctx.globalAlpha = (strong ? 1 : Math.min(1, near * 1.3) * (pickedId ? 0.65 : 0.9)) * shown;
          ctx.fillStyle = strong ? colors.fg : colors.fg2;
          ctx.fillText(g.group.name, p.x + r + (strong ? 16 : 11), p.y);
        }
      }
      ctx.globalAlpha = 1;
      flashes.current = flashes.current.filter((flash) => t - flash.at < 1200);
    };
    let raf = requestAnimationFrame(frame);

    const nodeAt = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      const x = e.clientX - box.left;
      const y = e.clientY - box.top;
      let best: string | null = null;
      let reach = 22;
      for (const node of nodes) {
        const far = Math.hypot(node.x - x, node.y - y);
        if (node.front && far < reach) {
          reach = far;
          best = node.id;
        }
      }
      return best;
    };

    const down = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, moved: 0 };
      spin = 0;
    };
    const move = (e: PointerEvent) => {
      if (!drag) {
        const over = nodeAt(e);
        el.style.cursor = over ? 'pointer' : 'grab';
        live.current.onHover(over);
        return;
      }
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag = { x: e.clientX, y: e.clientY, moved: drag.moved + Math.abs(dx) + Math.abs(dy) };
      if (drag.moved > 4) {
        // Turning it by hand lets go of the picked group.
        if (live.current.pickedId) live.current.onPick(null);
        el.style.cursor = 'grabbing';
        yaw += dx * 0.006;
        pitch = Math.max(-1.1, Math.min(1.1, pitch + dy * 0.006));
        spin = dx * 0.006 * 60 * 0.6; // keeps turning a little after you let go
      }
    };
    const up = (e: PointerEvent) => {
      if (drag && drag.moved <= 4) live.current.onPick(nodeAt(e));
      drag = null;
      el.style.cursor = 'grab';
    };
    const leave = () => live.current.onHover(null);
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', leave);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('pointerleave', leave);
    };
    // The colours are read from the theme, so a new theme starts the drawing again.
  }, [theme, halloween]);

  return (
    <canvas
      ref={canvas}
      className="hm-station-canvas"
      aria-label="The station as a sphere. Each point is an assignment group, as big as the pages it sent people this hour."
    />
  );
}
