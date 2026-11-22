/* Aide: a small guide that gets a new officer up to speed, on every page but sign-in.
 *
 *   dock     a row at the foot of the sidebar: its face, "Ask Aide", how far through the
 *            first shift you are, and Q. While the sidebar is tucked away, a floating orb
 *            stands in for it at the bottom left.
 *   peek     a speech bubble beside the dock, only while the panel is shut, and only when the
 *            aide has something new: hello on the first visit, a page it hasn't introduced yet,
 *            a mission you've just done. It leaves by itself after 8 seconds.
 *   panel    the chat. A floating glass window beside the sidebar that doesn't cover the page
 *            you're asking about. Drag it by its header and it snaps to the nearest corner.
 *   pointer  the aide pointing at the real element it's talking about (see Pointer.tsx).
 *
 * It listens, and never takes a key a page uses: Q opens and shuts it from anywhere outside a
 * field, Esc inside it shuts it and hands focus back. The panel is marked data-own-keys, so
 * typing in it never reaches the page's shortcuts. Missions tick off from what the person
 * really does: the address, ⌘K pressed, G then a letter. */

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowUp, X } from 'lucide-react';
import { navigate, type PageId } from '../../lib/route';
import { AideMark } from './AideMark';
import { DataToggle } from './dev/DataToggle';
import { faceRef, gaze, lookAt } from './eyes';
import { BRIEFS, briefFor, entryById, MISSIONS, type Action, type Mission } from './model';
import { Pointer } from './Pointer';
import { lower, Thread, type Do } from './Thread';
import { progress, useAide, type Corner, type Size } from './useAide';
import './Aide.css';

const PANEL_W = 360;
const PANEL_H = 600;
const MIN_W = 320;
const MAX_W = 640;
const MIN_H = 360;
/** Arrow keys on the resize corner: one step, or a bigger one with Shift. */
const KEY_STEP = 16;
const KEY_STEP_BIG = 64;
const EDGE = 12;
const PEEK_MS = 8000;
const CHORD_MS = 1300;

const panelFace = faceRef('panel', 36);
const dockFace = faceRef('dock', 28);
const orbFace = faceRef('orb', 28);

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The droid hops from one seat to the other: from the dock into the panel's header, and back.
 *
 *  A copy flies above everything, because the sidebar clips what leaves it, and it re-aims at
 *  the target every frame, because the panel is still settling while the droid is in the air.
 *  The real one stays hidden until the copy lands, so there's only ever one droid on screen. */
const HOP_MS = 320;
const HOP_LIFT = 22;
/** The in-out curve, cubic-bezier(0.77, 0, 0.175, 1), which is easeInOutQuart. */
const inOut = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);
let landing: (() => void) | null = null;

function hop(target: HTMLElement, from: DOMRect) {
  landing?.();
  const app = document.querySelector('.mn-app');
  const start = target.getBoundingClientRect();
  if (!app || !from.width || !start.width) return;
  const ghost = target.cloneNode(true) as HTMLElement;
  ghost.classList.add('mn-aide-ghost');
  ghost.style.width = `${start.width}px`;
  ghost.style.height = `${start.height}px`;
  app.append(ghost);
  target.style.visibility = 'hidden';
  const t0 = performance.now();
  let frame = 0;
  const land = () => {
    cancelAnimationFrame(frame);
    ghost.remove();
    target.style.visibility = '';
    landing = null;
  };
  landing = land;
  const fx = from.left + from.width / 2;
  const fy = from.top + from.height / 2;
  const tilt = from.left > start.left ? 10 : -10;
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / HOP_MS);
    const p = inOut(t);
    const to = target.getBoundingClientRect();
    const x = fx + (to.left + to.width / 2 - fx) * p - to.width / 2;
    const y = fy + (to.top + to.height / 2 - fy) * p - to.height / 2 - HOP_LIFT * Math.sin(Math.PI * p);
    const scale = from.width / to.width + (1 - from.width / to.width) * p;
    ghost.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${tilt * Math.sin(Math.PI * p)}deg)`;
    if (t < 1) frame = requestAnimationFrame(step);
    else land();
  };
  step(t0);
}

/** Glide the panel home from an offset, on the drawer curve: the release of a drag. */
function settle(el: HTMLElement, from: { x: number; y: number }) {
  el.style.transform = `translate(${from.x}px, ${from.y}px)`;
  el.getBoundingClientRect();
  delete el.dataset.dragging;
  if (!reduced()) el.dataset.settling = '';
  el.style.transform = '';
}

// ---------- where the person is ----------

const PAGES = new Set<string>([...Object.keys(BRIEFS), 'login']);

function here(): { page: PageId; parts: string[] } {
  const [page = '', ...parts] = window.location.hash.replace(/^#\/?/, '').split('?')[0]!.split('/').filter(Boolean);
  return { page: (PAGES.has(page) ? page : 'home') as PageId, parts };
}

/** Hears what the person does, for the missions. Selection changes rewrite the address without
 *  a hashchange (navigate(…, true)), so it also looks after every click and key. */
function useSignals(onPage: (page: PageId) => void) {
  const { hear, arrive } = useAide.getState();
  useEffect(() => {
    let last = '';
    let gAt = -Infinity;
    let frame = 0;
    const check = () => {
      if (window.location.hash === last) return;
      last = window.location.hash;
      const at = here();
      onPage(at.page);
      hear({ kind: 'route', ...at });
      if (performance.now() - gAt < CHORD_MS) hear({ kind: 'chord', page: at.page });
      gAt = -Infinity;
      arrive(at.page);
    };
    const soon = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(check);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!e.isTrusted) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') hear({ kind: 'palette' });
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA)$/.test(t.tagName) || t.closest('[data-own-keys]')) return;
      if (e.key === 'g') gAt = performance.now();
      if (/^(j|k|ArrowDown|ArrowUp)$/.test(e.key)) hear({ kind: 'pick', page: here().page });
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest?.('[data-tour="jump"]')) hear({ kind: 'palette' });
      if (t.closest?.('.mn-list') && t.closest('button, a, [role="option"], [role="row"], li')) hear({ kind: 'pick', page: here().page });
      soon();
    };
    check();
    window.addEventListener('hashchange', soon);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', soon);
    window.addEventListener('pointerup', onPointer);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', soon);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', soon);
      window.removeEventListener('pointerup', onPointer);
    };
  }, []);
}

// ---------- the shell around it ----------

interface Shell {
  /** The sidebar's right edge, or 0 while it's tucked away. */
  side: number;
  /** The dock's box, while the sidebar shows it. */
  dock: { left: number; right: number; top: number; bottom: number } | null;
  vw: number;
  vh: number;
}

/** Where the sidebar and dock are. Every page renders its own sidebar, so this watches the app
 *  root, which outlives them: a page swapping in, a sidebar sliding shut, the window resizing. */
function useShell(): Shell {
  const [shell, setShell] = useState<Shell>({ side: 0, dock: null, vw: window.innerWidth, vh: window.innerHeight });
  useLayoutEffect(() => {
    const app = document.querySelector<HTMLElement>('.mn-app');
    const ro = new ResizeObserver(() => measure());
    let watched: Element | null = null;
    let later = 0;
    const measure = () => {
      const side = document.querySelector<HTMLElement>('.mn-side');
      if (side !== watched) {
        ro.disconnect();
        if (side) ro.observe(side);
        watched = side;
      }
      const s = side?.getBoundingClientRect();
      const showing = !!s && s.width > 40 && getComputedStyle(side!).visibility !== 'hidden';
      const d = showing ? document.querySelector('[data-aide-dock]')?.getBoundingClientRect() : undefined;
      const next: Shell = {
        side: showing ? s.right : 0,
        dock: d && d.width ? { left: d.left, right: d.right, top: d.top, bottom: d.bottom } : null,
        vw: window.innerWidth,
        vh: window.innerHeight,
      };
      setShell((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    measure();
    // The sidebar goes hidden only once it has finished sliding shut (240ms, shell.css).
    const tucked = new MutationObserver(() => {
      clearTimeout(later);
      later = window.setTimeout(measure, 260);
    });
    const swapped = new MutationObserver(() => requestAnimationFrame(measure));
    if (app) {
      tucked.observe(app, { subtree: true, attributes: true, attributeFilter: ['data-hide-side'] });
      swapped.observe(app, { childList: true });
    }
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(later);
      ro.disconnect();
      tucked.disconnect();
      swapped.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return shell;
}

/** How big the panel may be in this window. A window too small for the minimum wins. */
function limits(shell: Shell) {
  const maxW = Math.max(0, Math.min(MAX_W, shell.vw - shell.side - EDGE * 2));
  const maxH = Math.max(0, shell.vh - EDGE * 2);
  return { minW: Math.min(MIN_W, maxW), maxW, minH: Math.min(MIN_H, maxH), maxH };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Where the panel goes: held to its corner, so a size change grows it away from that corner. */
function layout(corner: Corner, shell: Shell, w: number, h: number) {
  const left = corner[1] === 'l' ? shell.side + EDGE : shell.vw - EDGE - w;
  const top = corner[0] === 't' ? EDGE : shell.vh - EDGE - h;
  return { left, top, w, h };
}

function placeFor(corner: Corner, shell: Shell, size: Size | null = null) {
  const lim = limits(shell);
  return layout(corner, shell, clamp(size?.w ?? PANEL_W, lim.minW, lim.maxW), clamp(size?.h ?? PANEL_H, lim.minH, lim.maxH));
}

// ---------- resizing ----------

type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** The panel grows away from its corner: from the bottom-left, its top and right edges are free. */
const FREE: Record<Corner, { y: 'n' | 's'; x: 'e' | 'w' }> = {
  bl: { y: 'n', x: 'e' },
  br: { y: 'n', x: 'w' },
  tl: { y: 's', x: 'e' },
  tr: { y: 's', x: 'w' },
};

/** Which way dragging an edge grows the panel: +1 right or down, -1 left or up. */
const grows = (edge: Edge) => ({
  x: edge.includes('e') ? 1 : edge.includes('w') ? -1 : 0,
  y: edge.includes('s') ? 1 : edge.includes('n') ? -1 : 0,
});

/** Past a limit it gives a little, then stops: resistance, not a wall. */
const band = (v: number, min: number, max: number) => (v < min ? min - (min - v) * 0.2 : v > max ? max + (v - max) * 0.2 : v);

// ---------- the dock (in the sidebar) ----------

function Progress({ size }: { size: number }) {
  const done = useAide((s) => s.done);
  const { n, of } = progress(done);
  const r = size / 2 - 1;
  const c = 2 * Math.PI * r;
  return (
    <svg className="mn-aide-orbit" width={size} height={size} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} />
      <circle cx={size / 2} cy={size / 2} r={r} data-fill strokeDasharray={c} strokeDashoffset={c * (1 - n / of)} />
    </svg>
  );
}

export function AideDock() {
  const open = useAide((s) => s.open);
  const done = useAide((s) => s.done);
  const news = useAide((s) => !!s.peek);
  const { n, of } = progress(done);
  const toggle = () => (open ? useAide.getState().hide('pointer') : useAide.getState().show('pointer'));
  return (
    <button className="mn-aide-dock" data-aide-dock data-open={open ? '' : undefined} aria-expanded={!!open} onClick={toggle} title="Ask Aide  Q">
      <span className="mn-aide-face">
        <Progress size={32} />
        <AideMark size={28} done={n === of} mood={news ? 'news' : 'idle'} lookRef={dockFace} />
      </span>
      <span className="mn-aide-dock-text">Ask Aide</span>
      {n < of && (
        <span className="mn-aide-dock-count" title={`First shift: ${n} of ${of} done`}>
          {n}/{of}
        </span>
      )}
      <kbd>Q</kbd>
    </button>
  );
}

// ---------- the peek ----------

function Peek({ shell, orb }: { shell: Shell; orb: boolean }) {
  const peek = useAide((s) => s.peek);
  const done = useAide((s) => s.done);
  const { show, dropPeek, say } = useAide.getState();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!peek || paused) return;
    const t = setTimeout(dropPeek, PEEK_MS);
    return () => clearTimeout(t);
  }, [peek, paused]);

  if (!peek || (!shell.dock && !orb)) return null;
  const anchor = shell.dock ?? { left: 16, right: 60, top: shell.vh - 60, bottom: shell.vh - 16 };
  const style = { left: anchor.right + 10, bottom: shell.vh - anchor.bottom };

  const openWith = (fn?: () => void) => {
    show('pointer');
    fn?.();
  };

  let line;
  let yes;
  if (peek.kind === 'hello') {
    line = (
      <>
        <b>New to Imperial Ops?</b> I can get you up to speed in about ten minutes.
      </>
    );
    yes = { label: 'Say hello', run: () => openWith() };
  } else if (peek.kind === 'page') {
    const brief = briefFor(peek.page);
    line = (
      <>
        First time on <b>{brief?.name}</b>. Want the short version?
      </>
    );
    yes = { label: 'Show me', run: () => openWith(() => say({ kind: 'page', page: peek.page })) };
  } else {
    const mission = MISSIONS.find((m) => m.id === peek.mission)!;
    const next = progress(done).next;
    line = (
      <>
        <b>{mission.title}</b>, done. {next ? <>Next, {lower(next.title)}.</> : <>That's your first shift.</>}
      </>
    );
    yes = { label: next ? 'Next step' : 'Open Aide', run: () => openWith(() => say({ kind: 'done', mission: peek.mission })) };
  }

  return (
    <div
      className="mn-aide-peek"
      key={JSON.stringify(peek)}
      style={style}
      role="status"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      data-own-keys
    >
      <p>{line}</p>
      <div className="mn-aide-peek-acts">
        <button className="mn-aide-act" data-strong onClick={yes.run}>
          {yes.label}
        </button>
        <button className="mn-aide-act" data-quiet onClick={dropPeek}>
          Not now
        </button>
      </div>
    </div>
  );
}

// ---------- the panel ----------

function Panel({ page, shell }: { page: PageId; shell: Shell }) {
  const open = useAide((s) => s.open);
  const closedBy = useAide((s) => s.closedBy);
  const thread = useAide((s) => s.thread);
  const done = useAide((s) => s.done);
  const corner = useAide((s) => s.corner);
  const size = useAide((s) => s.size);
  const store = useAide.getState();
  const [text, setText] = useState('');
  const [acknowledge, setAcknowledge] = useState(0);
  const panel = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const settleFrom = useRef<{ x: number; y: number } | null>(null);
  const drag = useRef<{ x0: number; y0: number; dx: number; dy: number; moved: boolean; trail: { t: number; x: number; y: number }[] } | null>(null);
  const sizing = useRef<{ edge: Edge; x0: number; y0: number; w0: number; h0: number; w: number; h: number; pinned: boolean } | null>(null);
  /** The size before a double-click stretched it to full height, to go back to. */
  const beforeTall = useRef<Size | null>(null);

  const place = placeFor(corner, shell, size);
  const lim = limits(shell);
  const free = FREE[corner];
  const brief = briefFor(page);
  const { n, of } = progress(done);
  const instant = open ? open === 'key' : closedBy === 'key';

  // Opening: focus the question box. Shutting: hand focus back to where it was.
  useEffect(() => {
    if (open) {
      const active = document.activeElement as HTMLElement | null;
      returnTo.current = active && active !== document.body && !panel.current?.contains(active) ? active : null;
      input.current?.focus({ preventScroll: true });
    } else if (panel.current?.contains(document.activeElement)) {
      const back = returnTo.current;
      (back?.isConnected ? back : (document.querySelector('[data-aide-dock]') as HTMLElement | null))?.focus({ preventScroll: true });
    }
  }, [open]);

  // Opened or shut with the pointer, the droid hops between its seats. From the keyboard it's
  // simply there: a key gets an instant answer (DESIGN.md, Motion).
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    const was = wasOpen.current;
    wasOpen.current = !!open;
    if (was === !!open || reduced()) return;
    const seat = document.querySelector<HTMLElement>(shell.dock ? '[data-aide-dock] .mn-aide-mark' : '.mn-aide-orb .mn-aide-mark');
    const head = panel.current?.querySelector<HTMLElement>('.mn-aide-head .mn-aide-mark');
    if (!seat || !head) return;
    if (open === 'pointer') hop(head, seat.getBoundingClientRect());
    else if (!open && closedBy === 'pointer') hop(seat, head.getBoundingClientRect());
  }, [open]);

  // Something new was said: bring its start into view (a long answer is read from the top),
  // and acknowledge it with a small nod.
  const lastId = thread[thread.length - 1]?.id;
  const seenId = useRef(0);
  useEffect(() => {
    const el = scroller.current;
    if (!el || !open || lastId === undefined) return;
    const first = thread.find((m) => m.id > seenId.current) ?? thread[thread.length - 1]!;
    seenId.current = lastId;
    const start = el.querySelector<HTMLElement>(`[data-msg="${first.id}"]`);
    const top = Math.min((start?.offsetTop ?? el.scrollHeight) - 12, el.scrollHeight - el.clientHeight);
    el.scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' });
    if (thread[thread.length - 1]?.from === 'aide') setAcknowledge((n) => n + 1);
  }, [lastId, open]);

  // While it's open, its head follows the pointer, a little.
  useEffect(() => {
    if (!open || reduced()) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => !gaze.busy && lookAt(true, { x: e.clientX, y: e.clientY }));
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      lookAt(true, null);
    };
  }, [open]);

  // After a drag lands in a new corner, glide from where it was let go.
  useLayoutEffect(() => {
    const el = panel.current;
    const from = settleFrom.current;
    if (!el || !from) return;
    settleFrom.current = null;
    settle(el, from);
  });

  const close = (by: 'pointer' | 'key') => store.hide(by);

  const act: Do = {
    run: (action: Action) => {
      if (action.kind === 'show') return store.pointAt(action.target);
      if (action.kind === 'tour') {
        close('pointer');
        // The page's own `?` starts its tour.
        setTimeout(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true })), 220);
        return;
      }
      if (action.page === page) return action.target && store.pointAt(action.target);
      if (action.target) store.pointOnArrival(action.page, action.target);
      navigate(action.href);
    },
    ask: (q) => store.ask(q, page),
    tryMission: (m: Mission) => {
      if (m.id === 'palette') return window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
      if (m.id === 'chord') {
        const keys = entryById('keys');
        return keys && store.say({ kind: 'reply', reply: { kind: 'answer', entry: keys } });
      }
      if (m.page !== page) return navigate(m.href);
      const first = briefFor(page)?.points[0];
      if (first) store.pointAt(first.target);
    },
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    store.ask(text, page);
    setText('');
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close('key');
    } else if (e.key === 'ArrowUp' && e.target === input.current && !text) {
      // Up in an empty box brings back the last question, as a terminal does.
      const last = [...thread].reverse().find((m) => m.from === 'you');
      if (last && last.from === 'you') {
        e.preventDefault();
        setText(last.text);
      }
    }
  };

  // ---------- drag to a corner ----------

  const onDown = (e: ReactPointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button, input, a')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, moved: false, trail: [] };
  };

  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    const el = panel.current;
    if (!d || !el) return;
    d.dx = e.clientX - d.x0;
    d.dy = e.clientY - d.y0;
    if (!d.moved && Math.hypot(d.dx, d.dy) < 4) return;
    if (!d.moved) {
      d.moved = true;
      el.dataset.dragging = '';
      delete el.dataset.settling;
    }
    // Past the window's edge it resists, rather than stopping dead.
    const band = (v: number, min: number, max: number) => (v < min ? min - (min - v) * 0.2 : v > max ? max + (v - max) * 0.2 : v);
    const x = band(place.left + d.dx, EDGE, shell.vw - EDGE - place.w) - place.left;
    const y = band(place.top + d.dy, EDGE, shell.vh - EDGE - place.h) - place.top;
    el.style.transform = `translate(${x}px, ${y}px)`;
    d.trail.push({ t: e.timeStamp, x: x, y: y });
    if (d.trail.length > 6) d.trail.shift();
  };

  const onUp = (e: ReactPointerEvent) => {
    const d = drag.current;
    drag.current = null;
    const el = panel.current;
    if (!d?.moved || !el) return;
    const last = d.trail[d.trail.length - 1] ?? { t: e.timeStamp, x: d.dx, y: d.dy };
    const first = d.trail.find((p) => last.t - p.t < 100) ?? last;
    const dt = Math.max(1, last.t - first.t);
    // Thrown, it lands where it was heading, not where the pointer let go.
    const cx = place.left + last.x + place.w / 2 + ((last.x - first.x) / dt) * 180;
    const cy = place.top + last.y + place.h / 2 + ((last.y - first.y) / dt) * 180;
    const corners: Corner[] = ['bl', 'br', 'tl', 'tr'];
    const nearest = corners
      .map((c) => {
        const p = placeFor(c, shell, size);
        return { c, p, dist: Math.hypot(p.left + p.w / 2 - cx, p.top + p.h / 2 - cy) };
      })
      .sort((a, b) => a.dist - b.dist)[0]!;
    const from = { x: place.left + last.x - nearest.p.left, y: place.top + last.y - nearest.p.top };
    // Same corner: nothing re-renders, so it settles here. A new one settles after the move.
    if (nearest.c === corner) settle(el, from);
    else {
      settleFrom.current = from;
      store.moveTo(nearest.c);
    }
  };

  // ---------- resize from the free edges ----------

  /** Write a size straight to the panel while a hand is on it: no React render per move. */
  const paint = (w: number, h: number) => {
    const el = panel.current;
    if (!el) return;
    const p = layout(corner, shell, w, h);
    el.style.left = `${p.left}px`;
    el.style.top = `${p.top}px`;
    el.style.width = `${p.w}px`;
    el.style.height = `${p.h}px`;
    // Reading the latest message while resizing, it stays in view.
    if (sizing.current?.pinned && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  };

  /** Set a size, gliding to it when a pointer asked (a key gets it at once). */
  const resizeTo = (next: Size | null, by: 'pointer' | 'key') => {
    const el = panel.current;
    if (el && by === 'pointer' && !reduced()) el.dataset.sizing = '';
    store.resize(next);
  };

  const onEdgeDown = (edge: Edge) => (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const el = scroller.current;
    sizing.current = {
      edge,
      x0: e.clientX,
      y0: e.clientY,
      w0: place.w,
      h0: place.h,
      w: place.w,
      h: place.h,
      pinned: !!el && el.scrollHeight - el.scrollTop - el.clientHeight < 24,
    };
    panel.current!.dataset.resizing = '';
    delete panel.current!.dataset.sizing;
  };

  const onEdgeMove = (e: ReactPointerEvent) => {
    const r = sizing.current;
    if (!r) return;
    const g = grows(r.edge);
    r.w = g.x ? band(r.w0 + g.x * (e.clientX - r.x0), lim.minW, lim.maxW) : r.w0;
    r.h = g.y ? band(r.h0 + g.y * (e.clientY - r.y0), lim.minH, lim.maxH) : r.h0;
    paint(r.w, r.h);
  };

  const onEdgeUp = () => {
    const r = sizing.current;
    const el = panel.current;
    sizing.current = null;
    if (!r || !el) return;
    delete el.dataset.resizing;
    const w = clamp(r.w, lim.minW, lim.maxW);
    const h = clamp(r.h, lim.minH, lim.maxH);
    // Let go past a limit, it springs back to it.
    if ((w !== r.w || h !== r.h) && !reduced()) el.dataset.sizing = '';
    paint(w, h);
    if (w !== r.w0 || h !== r.h0) {
      beforeTall.current = null;
      store.resize({ w, h });
    }
  };

  /** Double-click the header: stretch to the window's full height, and back. */
  const onHeadDouble = (e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a')) return;
    if (place.h >= lim.maxH - 1 && beforeTall.current) {
      resizeTo(beforeTall.current, 'pointer');
      beforeTall.current = null;
    } else {
      beforeTall.current = { w: place.w, h: place.h };
      resizeTo({ w: place.w, h: lim.maxH }, 'pointer');
    }
  };

  /** The resize corner from the keyboard: arrows grow or shrink it, Enter puts it back. */
  const onCornerKey = (e: ReactKeyboardEvent) => {
    const step = e.shiftKey ? KEY_STEP_BIG : KEY_STEP;
    const tall = free.y === 'n' ? -1 : 1;
    const wide = free.x === 'e' ? 1 : -1;
    const by: Record<string, [number, number]> = {
      ArrowUp: [0, -tall * step],
      ArrowDown: [0, tall * step],
      ArrowLeft: [-wide * step, 0],
      ArrowRight: [wide * step, 0],
    };
    if (e.key === 'Enter') {
      e.preventDefault();
      beforeTall.current = null;
      resizeTo(null, 'key');
      return;
    }
    const d = by[e.key];
    if (!d) return;
    e.preventDefault();
    e.stopPropagation();
    resizeTo({ w: clamp(place.w + d[0], lim.minW, lim.maxW), h: clamp(place.h + d[1], lim.minH, lim.maxH) }, 'key');
  };

  const edges: Edge[] = [free.y, free.x];
  const cornerEdge = `${free.y}${free.x}` as Edge;

  return (
    <section
      ref={panel}
      className="mn-aide-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="mn-aide-title"
      data-open={open ? '' : undefined}
      data-instant={instant || undefined}
      data-corner={corner}
      data-own-keys
      // Focusable itself, so a press on its header keeps focus inside and Esc still shuts it.
      tabIndex={-1}
      inert={!open}
      style={{ left: place.left, top: place.top, width: place.w, height: place.h }}
      onKeyDown={onKeyDown}
      onTransitionEnd={(e) => {
        if (e.target !== panel.current) return;
        if (e.propertyName === 'transform') delete panel.current.dataset.settling;
        if (e.propertyName === 'width' || e.propertyName === 'height') delete panel.current.dataset.sizing;
      }}
    >
      {edges.map((edge) => (
        <span
          key={edge}
          className="mn-aide-edge"
          data-edge={edge}
          aria-hidden
          onPointerDown={onEdgeDown(edge)}
          onPointerMove={onEdgeMove}
          onPointerUp={onEdgeUp}
          onPointerCancel={onEdgeUp}
        />
      ))}
      <span
        className="mn-aide-edge mn-aide-corner"
        data-edge={cornerEdge}
        role="button"
        tabIndex={0}
        aria-label={`Resize Aide, ${Math.round(place.w)} by ${Math.round(place.h)}. Arrow keys change the size, Enter puts it back.`}
        title="Drag to resize. Double-click to reset."
        onPointerDown={onEdgeDown(cornerEdge)}
        onPointerMove={onEdgeMove}
        onPointerUp={onEdgeUp}
        onPointerCancel={onEdgeUp}
        onDoubleClick={() => {
          beforeTall.current = null;
          resizeTo(null, 'pointer');
        }}
        onKeyDown={onCornerKey}
      >
        <svg viewBox="0 0 22 22" aria-hidden>
          <path d="M 2 2.5 H 8 A 11.5 11.5 0 0 1 19.5 14 V 20" />
        </svg>
      </span>
      <header
        className="mn-aide-head"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onDoubleClick={onHeadDouble}
        title="Drag to move. Double-click for full height."
      >
        <span className="mn-aide-grip" aria-hidden />
        <AideMark size={36} acknowledge={acknowledge} done={n === of} mood={text.trim() ? 'listening' : 'idle'} lookRef={panelFace} />
        <div className="mn-aide-title">
          <b id="mn-aide-title">Aide</b>
          <span>{brief ? `With you on ${brief.name}` : 'Your guide to Imperial Ops'}</span>
        </div>
        <button className="mn-aide-chip" onClick={() => store.say({ kind: 'shift' })} title="Your first shift" aria-label={`First shift, ${n} of ${of} done`}>
          {n}/{of}
        </button>
        <button className="mn-icon-btn" onClick={() => close('pointer')} aria-label="Close" title="Close  Esc">
          <X size={15} />
        </button>
      </header>

      <div className="mn-aide-thread" ref={scroller} aria-live="polite">
        <Thread thread={thread} page={page} act={act} />
      </div>

      <footer className="mn-aide-foot">
        {brief && (
          <div className="mn-aide-asks" aria-label="Suggested questions">
            {brief.asks.map((q) => (
              <button key={q} className="mn-aide-ask" onClick={() => store.ask(q, page)}>
                {q}
              </button>
            ))}
          </div>
        )}
        <form className="mn-aide-compose" onSubmit={submit}>
          <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about a page, a key or a colour…" aria-label="Ask Aide" autoComplete="off" />
          <button type="submit" className="mn-aide-send" disabled={!text.trim()} aria-label="Send">
            <ArrowUp size={15} />
          </button>
        </form>
      </footer>
    </section>
  );
}

// ---------- the floating orb (sidebar tucked away) ----------

function Orb() {
  const open = useAide((s) => s.open);
  const done = useAide((s) => s.done);
  const news = useAide((s) => !!s.peek);
  const { n, of } = progress(done);
  // Kept mounted while the panel is open: it's the seat the droid hops back to.
  return (
    <button
      className="mn-aide-orb"
      data-open={open ? '' : undefined}
      tabIndex={open ? -1 : undefined}
      onClick={() => useAide.getState().show('pointer')}
      aria-label="Ask Aide"
      title="Ask Aide  Q"
    >
      <Progress size={40} />
      <AideMark size={28} done={n === of} mood={news ? 'news' : 'idle'} lookRef={orbFace} />
    </button>
  );
}

// ---------- all of it ----------

export function Aide() {
  const [page, setPage] = useState<PageId>(() => here().page);
  const open = useAide((s) => s.open);
  const shell = useShell();
  useSignals(setPage);

  // Q, from anywhere outside a field, while nothing else has the keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'q' && e.key !== 'Q') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (document.querySelector('.mn-tour, .mn-palette, [role="dialog"][aria-modal="true"]')) return;
      e.preventDefault();
      const s = useAide.getState();
      if (s.open) s.hide('key');
      else s.show('key');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const orb = !shell.dock;
  return (
    <>
      {import.meta.env.DEV && <DataToggle />}
      {orb && <Orb />}
      <Peek shell={shell} orb={orb} />
      <Panel page={page} shell={shell} />
      <Pointer panelOpen={!!open} onMissing={() => useAide.getState().open && useAide.getState().say({ kind: 'missing' })} />
    </>
  );
}
