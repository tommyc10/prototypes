/* The haunting: what flies over every page while Halloween mode is on.
 *
 *   Ghosts     four sheet ghosts wander the window. They're scared of the pointer: come near
 *              and one shouts "boo" and darts off. They keep clear of whatever has focus too,
 *              so nobody types into a field with a ghost sitting on it. Now and then one fades out and comes back
 *              somewhere else. Their motion is a spring towards a point that drifts on slow
 *              sine waves, so it never repeats and never needs a path.
 *   Bats       a flock crosses the window every 20 seconds or so, flapping.
 *   The web    hangs in the top-right corner, and its spider drops down on a thread and climbs back.
 *
 * It's a layer over the page that never catches a click (pointer-events: none), under ⌘K,
 * dialogs and the tour. With reduced motion it isn't there at all. */

import { useEffect, useRef, useState } from 'react';
import { BatArt, GhostArt } from './Creatures';
import './Haunting.css';

const GHOSTS = [
  { size: 92, speed: 1 },
  { size: 66, speed: 1.3 },
  { size: 78, speed: 0.8 },
  { size: 54, speed: 1.6 },
];

const FLOCK = [
  { top: 18, delay: 0, size: 46 },
  { top: 22, delay: 0.5, size: 34 },
  { top: 14, delay: 0.9, size: 38 },
  { top: 26, delay: 1.3, size: 28 },
  { top: 19, delay: 1.7, size: 42 },
  { top: 12, delay: 2.2, size: 30 },
  { top: 24, delay: 2.6, size: 36 },
];

const FLEE_RADIUS = 220;
const BOO_RADIUS = 110;

function useReducedMotion() {
  const [reduce, setReduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduce(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  return reduce;
}

export function Haunting() {
  const reduce = useReducedMotion();
  const ghostRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reduce) return;
    const pointer = { x: -9999, y: -9999 };
    const move = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const leave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);

    const start = performance.now();
    const ghosts = GHOSTS.map((g, i) => ({
      ...g,
      el: ghostRefs.current[i]!,
      seed: i * 1.7 + Math.random() * 6,
      x: window.innerWidth * (0.2 + Math.random() * 0.6),
      y: window.innerHeight * (0.2 + Math.random() * 0.6),
      vx: 0,
      vy: 0,
      alpha: 0,
      // Each ghost shows for a while, fades out, and comes back somewhere else.
      fadeAt: start + 9000 + Math.random() * 12000,
      fading: false,
      booUntil: 0,
    }));

    let last = start;
    let raf = requestAnimationFrame(function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Read before any writes this frame, so it doesn't force a layout.
      const focused =
        document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement.getBoundingClientRect() : null;

      for (const g of ghosts) {
        // Where it's drifting to: a point that wanders the window on slow sine waves.
        const k = t * 0.0001 * g.speed;
        const tx = w * (0.5 + 0.42 * Math.sin(k * 1.3 + g.seed) * Math.cos(k * 0.7 + g.seed * 2));
        const ty = h * (0.5 + 0.38 * Math.sin(k * 1.7 + g.seed * 3));
        let ax = (tx - g.x) * 0.9;
        let ay = (ty - g.y) * 0.9;

        // Scared of the pointer.
        const dx = g.x - pointer.x;
        const dy = g.y - pointer.y;
        const d = Math.hypot(dx, dy) || 1;
        const scared = d < FLEE_RADIUS;
        if (scared) {
          const push = ((FLEE_RADIUS - d) / FLEE_RADIUS) * 5200;
          ax += (dx / d) * push;
          ay += (dy / d) * push;
          if (d < BOO_RADIUS && t > g.booUntil + 1800) {
            g.booUntil = t + 700;
            g.el.dataset.boo = '';
          }
        }
        if (g.booUntil && t > g.booUntil) {
          g.booUntil = 0;
          delete g.el.dataset.boo;
        }

        // And of the focused thing: pushed out of its box, with a margin.
        if (focused) {
          const cx = Math.max(focused.left, Math.min(g.x, focused.right));
          const cy = Math.max(focused.top, Math.min(g.y, focused.bottom));
          const fx = g.x - cx;
          const fy = g.y - cy;
          const fd = Math.hypot(fx, fy);
          const reach = g.size * 0.6 + 40;
          if (fd < reach) {
            const away = fd ? [fx / fd, fy / fd] : [0, g.y < (focused.top + focused.bottom) / 2 ? -1 : 1];
            ax += away[0] * 4000;
            ay += away[1] * 4000;
          }
        }

        const damping = Math.pow(0.12, dt);
        g.vx = (g.vx + ax * dt) * damping;
        g.vy = (g.vy + ay * dt) * damping;
        const top = scared || focused ? 900 : 220;
        const speed = Math.hypot(g.vx, g.vy);
        if (speed > top) {
          g.vx *= top / speed;
          g.vy *= top / speed;
        }
        g.x += g.vx * dt;
        g.y += g.vy * dt;

        // Fade out, reappear somewhere else, fade in.
        if (!g.fading && t > g.fadeAt) g.fading = true;
        if (g.fading) {
          g.alpha -= dt / 1.2;
          if (g.alpha <= 0) {
            g.alpha = 0;
            g.fading = false;
            g.x = w * (0.1 + Math.random() * 0.8);
            g.y = h * (0.15 + Math.random() * 0.7);
            g.vx = g.vy = 0;
            g.fadeAt = t + 10000 + Math.random() * 14000;
          }
        } else {
          g.alpha = Math.min(1, g.alpha + dt / 1.4);
        }

        const tilt = Math.max(-24, Math.min(24, g.vx * 0.06));
        g.el.style.transform = `translate3d(${g.x - g.size / 2}px, ${g.y - g.size / 2}px, 0) rotate(${tilt}deg)`;
        g.el.style.opacity = String(g.alpha * 0.9);
      }
      raf = requestAnimationFrame(frame);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <div className="hw-haunting" aria-hidden>
      {GHOSTS.map((g, i) => (
        <div
          key={i}
          ref={(el) => {
            ghostRefs.current[i] = el;
          }}
          className="hw-ghost"
          style={{ width: g.size, height: g.size * 1.15, opacity: 0 }}
        >
          <div className="hw-ghost-bob" style={{ animationDelay: `${-i * 0.7}s` }}>
            <GhostArt width="100%" height="100%" />
          </div>
        </div>
      ))}

      <div className="hw-flock">
        {FLOCK.map((b, i) => (
          <div key={i} className="hw-flock-bat" style={{ top: `${b.top}%`, animationDelay: `${b.delay}s` }}>
            <div className="hw-flock-wave" style={{ animationDelay: `${-i * 0.3}s` }}>
              <BatArt width={b.size} height={b.size * 0.4} />
            </div>
          </div>
        ))}
      </div>

      <svg className="hw-web" viewBox="0 0 160 160">
        <path d="M160 0L0 0M160 0L20 70M160 0L60 130M160 0L120 160M160 0L160 160" />
        <path d="M128 0Q140 14 146 26Q150 38 160 32M96 0Q112 26 124 46Q136 66 160 64M64 0Q86 38 104 66Q122 94 160 96M34 0Q60 50 82 86Q104 120 160 128" />
      </svg>
      <div className="hw-spider-drop">
        <div className="hw-spider-thread" />
        <svg className="hw-spider-svg" viewBox="-20 -14 40 30">
          <ellipse cx="0" cy="0" rx="6" ry="7" />
          <circle cx="0" cy="-8" r="4" />
          <circle className="hw-spider-eye" cx="-1.6" cy="-9" r="1" />
          <circle className="hw-spider-eye" cx="1.6" cy="-9" r="1" />
          <path className="hw-spider-legs" d="M-5-2l-9-6-3 6M-5 1l-10 0-3 7M-5 4l-8 5-2 6M5-2l9-6 3 6M5 1l10 0 3 7M5 4l8 5 2 6" />
        </svg>
      </div>
    </div>
  );
}
