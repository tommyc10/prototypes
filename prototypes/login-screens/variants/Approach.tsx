/* Approach: one spatial object. The station turns slowly beside the form, its assignment
 * groups the brighter points on it. Signing in spins it up while the service answers; a
 * wrong password stalls it; getting in flies you into it, which is where the home page's
 * globe picks up. The pointer leans it a little, on a spring. */

import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Theme } from '../../../src/hooks/useTheme';
import { GROUPS } from '../../../src/pages/rule-management/data/mockData';
import { Fields, Mark, Notice, still, SubmitButton, token, useSignIn } from '../shared';

type Vec = [number, number, number];

/** Points spread evenly over the sphere, leaving a trench round its middle. */
const SURFACE: Vec[] = (() => {
  const out: Vec[] = [];
  const count = 1300;
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const lon = i * Math.PI * (3 - Math.sqrt(5));
    const r = Math.sqrt(1 - y * y);
    if (Math.abs(y) > 0.03) out.push([r * Math.sin(lon), y, r * Math.cos(lon)]);
  }
  return out;
})();

/** One point per assignment group, spread round the station. */
const GROUP_POINTS: Vec[] = GROUPS.map((_, i) => {
  const lat = ((i % 2 ? 1 : -1) * (14 + ((i * 17) % 30)) * Math.PI) / 180;
  const lon = (i / GROUPS.length) * Math.PI * 2;
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
});

const TRENCH: Vec[] = Array.from({ length: 240 }, (_, i) => [Math.sin((i / 240) * Math.PI * 2), 0, Math.cos((i / 240) * Math.PI * 2)]);

const SPEED = { idle: 0.07, submitting: 1.1, success: 0.25 };
const FLY_MS = 1200;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function Approach({ theme }: { theme: Theme }) {
  const stall = useRef(0);
  const auth = useSignIn({ onFail: () => (stall.current = 1) });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ status: auth.status, successAt: 0 });
  if (live.current.status !== auth.status) {
    live.current = { status: auth.status, successAt: auth.status === 'success' ? performance.now() : 0 };
  }

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const ink = token(canvas, '--fg');
    const quiet = token(canvas, '--fg-3');
    const reduce = still();
    let frame = 0;
    let last = performance.now();
    let yaw = 0.6;
    let speed = SPEED.idle;
    const lean = { x: 0, y: 0, tx: 0, ty: 0 };

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    size();
    const onMove = (e: PointerEvent) => {
      lean.tx = (e.clientX / window.innerWidth - 0.5) * 0.5;
      lean.ty = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener('resize', size);
    window.addEventListener('pointermove', onMove);

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { status, successAt } = live.current;
      // Speed follows where the sign-in has got to; a failure brakes it hard, then it recovers.
      const target = SPEED[status] * (1 - stall.current);
      speed += (target - speed) * Math.min(1, dt * (stall.current ? 9 : 2.2));
      stall.current = Math.max(0, stall.current - dt * 1.4);
      if (!reduce) yaw += speed * dt;
      lean.x += (lean.tx - lean.x) * Math.min(1, dt * 3);
      lean.y += (lean.ty - lean.y) * Math.min(1, dt * 3);

      const fly = successAt && !reduce ? Math.min(1, (now - successAt) / FLY_MS) : 0;
      const zoom = easeInOut(fly);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const wide = w > h * 1.1;
      const cx = wide ? w * (0.62 - zoom * 0.12) : w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * (wide ? 0.3 : 0.26) * (1 + zoom * 5);
      const fade = 1 - Math.max(0, (fly - 0.55) / 0.45);

      const ry = yaw + lean.x;
      const rx = 0.32 + lean.y;
      const project = ([x, y, z]: Vec): [number, number, number] => {
        const x1 = x * Math.cos(ry) + z * Math.sin(ry);
        const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
        const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
        const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
        return [cx + x1 * radius, cy - y2 * radius, z2];
      };
      const dpr = w / canvas.clientWidth;

      ctx.fillStyle = ink;
      for (const p of SURFACE) {
        const [x, y, z] = project(p);
        if (z < -0.15) continue;
        ctx.globalAlpha = (0.14 + 0.66 * Math.max(0, z)) * fade;
        const r = (1 + 0.9 * Math.max(0, z)) * dpr;
        ctx.fillRect(x - r / 2, y - r / 2, r, r);
      }
      ctx.fillStyle = quiet;
      for (const p of TRENCH) {
        const [x, y, z] = project(p);
        if (z < 0) continue;
        ctx.globalAlpha = 0.7 * z * fade;
        ctx.fillRect(x - dpr * 0.6, y - dpr * 0.6, dpr * 1.2, dpr * 1.2);
      }
      // The groups: brighter, with a hairline ring, as on the home page's globe.
      for (const p of GROUP_POINTS) {
        const [x, y, z] = project(p);
        if (z < 0) continue;
        ctx.globalAlpha = (0.35 + 0.65 * z) * fade;
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(x, y, 2.6 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.globalAlpha = 0.3 * z * fade;
        ctx.lineWidth = dpr;
        ctx.beginPath();
        ctx.arc(x, y, 6 * dpr, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', size);
      window.removeEventListener('pointermove', onMove);
    };
  }, [theme]);

  const done = auth.status === 'success';
  return (
    <div className="mn lgp ap" data-done={done || undefined}>
      <canvas ref={canvasRef} className="ap-canvas" aria-hidden />

      <main className="ap-panel">
        <div className="lgp-brand">
          <Mark />
          Imperial Ops
        </div>
        <h1 className="ap-title">Sign in to the station</h1>
        <p className="ap-lead">Use your work account. You’ll land on what needs a person.</p>
        <form className="lg-form" onSubmit={auth.submit} noValidate>
          <Notice note={auth.note} />
          <Fields auth={auth} idPrefix="ap" />
          <SubmitButton auth={auth} />
        </form>
      </main>

      <p className="ap-caption mn-mono">
        {GROUPS.length} groups on watch <span>·</span> 14:20 UTC
      </p>

      {done && (
        <div className="ap-arrived" role="status">
          <p className="ap-arrived-title">Welcome back.</p>
          <a className="mn-link ap-arrived-link" href="/#/">
            Open Imperial Ops <ArrowRight size={13} />
          </a>
        </div>
      )}
    </div>
  );
}
