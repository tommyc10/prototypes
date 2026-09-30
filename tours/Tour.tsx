/* The guided tour. The page behind is blurred and dimmed, except for a spotlight cut
 * around the element the step is about; a card beside it explains what it's for.
 * Moving between steps, the spotlight and card glide to the next element, so your eye
 * follows along.
 *
 *   veil    the blur + dim, with the spotlight masked out of it (see Tour.css)
 *   ring    a thin outline on the spotlight's edge
 *   card    step count, title, text, Back / Next
 *
 * The target is found by `data-tour="…"` and measured every frame, so the spotlight
 * keeps up when the target moves: a column sliding open, the form animating in, a scroll.
 *
 * It knows nothing about the page it tours: the steps come in as a prop (see
 * rule-management.tsx), and it uses the page's tokens (--glass-palette, --line…) and its
 * .mn-btn / .mn-icon-btn buttons. */

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import './Tour.css';

export type TourSide = 'right' | 'left' | 'bottom' | 'top';

export interface TourStep {
  /** The `data-tour` value of the element to spotlight. None: a centred card, whole page veiled. */
  target?: string;
  side?: TourSide;
  title: string;
  body: ReactNode;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PAD = 6; // room between the target and the spotlight's edge
const GAP = 14; // between the spotlight and the card
const MARGIN = 12; // keep the card this far inside the window
const CARD_W = 340;
const LEAVE_MS = 180; // matches the fade-out in Tour.css

/** The target's box plus padding, trimmed to the window (a tall list shouldn't spill off-screen). */
function measure(el: HTMLElement): Box | null {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const x = Math.max(4, r.left - PAD);
  const y = Math.max(4, r.top - PAD);
  const right = Math.min(window.innerWidth - 4, r.right + PAD);
  const bottom = Math.min(window.innerHeight - 4, r.bottom + PAD);
  return right > x && bottom > y ? { x, y, w: right - x, h: bottom - y } : null;
}

const OPPOSITE: Record<TourSide, TourSide> = { right: 'left', left: 'right', bottom: 'top', top: 'bottom' };

/** Where the card goes: the step's preferred side if it fits, then the others; centred when there's no target. */
function place(box: Box | null, preferred: TourSide, h: number, vw: number, vh: number) {
  const clampX = (x: number) => Math.min(vw - MARGIN - CARD_W, Math.max(MARGIN, x));
  const clampY = (y: number) => Math.min(vh - MARGIN - h, Math.max(MARGIN, y));
  if (!box) return { x: clampX((vw - CARD_W) / 2), y: clampY((vh - h) / 2) };

  const sides = [...new Set<TourSide>([preferred, OPPOSITE[preferred], 'bottom', 'right', 'left', 'top'])];
  for (const side of sides) {
    if (side === 'right' && box.x + box.w + GAP + CARD_W <= vw - MARGIN)
      return { x: box.x + box.w + GAP, y: clampY(box.y) };
    if (side === 'left' && box.x - GAP - CARD_W >= MARGIN) return { x: box.x - GAP - CARD_W, y: clampY(box.y) };
    if (side === 'bottom' && box.y + box.h + GAP + h <= vh - MARGIN)
      return { x: clampX(box.x), y: box.y + box.h + GAP };
    if (side === 'top' && box.y - GAP - h >= MARGIN) return { x: clampX(box.x), y: box.y - GAP - h };
  }
  // No room anywhere (the target fills the window): sit inside its bottom-right corner.
  return { x: clampX(box.x + box.w - CARD_W - GAP), y: clampY(box.y + box.h - h - GAP) };
}

export function Tour({
  steps,
  index,
  onIndex,
  onDone,
}: {
  steps: TourStep[];
  index: number;
  onIndex: (index: number) => void;
  onDone: () => void;
}) {
  const step = steps[index];
  const last = index === steps.length - 1;
  const [box, setBox] = useState<Box | null>(null);
  const [view, setView] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [cardH, setCardH] = useState(220);
  const [leaving, setLeaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Find the step's target, bring it into view, then follow it every frame.
  useLayoutEffect(() => {
    let frame = 0;
    let seen = '';
    let scrolled = false;
    const follow = () => {
      const el = step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null;
      if (el && !scrolled) {
        el.scrollIntoView({ block: 'nearest' });
        scrolled = true;
      }
      const next = el ? measure(el) : null;
      const key = next ? `${Math.round(next.x)} ${Math.round(next.y)} ${Math.round(next.w)} ${Math.round(next.h)}` : '';
      if (key !== seen) {
        seen = key;
        setBox(next);
      }
      frame = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(frame);
  }, [step.target]);

  useEffect(() => {
    const onResize = () => setView({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // The card's height decides where it fits, and changes with each step's text.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    setCardH(el.offsetHeight);
    const observer = new ResizeObserver(() => setCardH(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keep focus on the card, so ↵ and Tab go to its buttons.
  useEffect(() => nextRef.current?.focus({ preventScroll: true }), [index]);

  const leave = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onDone, LEAVE_MS);
  };
  const next = () => (last ? leave() : onIndex(index + 1));
  const back = () => index > 0 && onIndex(index - 1);

  // The live values are read through a ref, so the listener is added once.
  const keys = useRef({ next, back, leave });
  keys.current = { next, back, leave };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = keys.current;
      const run = { ArrowRight: k.next, Enter: k.next, ArrowLeft: k.back, Escape: k.leave }[e.key];
      if (!run || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      e.stopPropagation();
      run();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  // With no target the spotlight shrinks to a point in the middle, so the whole page is veiled.
  const hole = box ?? { x: view.w / 2, y: view.h / 2, w: 0, h: 0 };
  const spot = {
    '--sx': `${hole.x}px`,
    '--sy': `${hole.y}px`,
    '--sw': `${hole.w}px`,
    '--sh': `${hole.h}px`,
  } as CSSProperties;
  const at = place(box, step.side ?? 'right', cardH, view.w, view.h);

  return (
    <div className="mn-tour" data-leaving={leaving || undefined}>
      <div className="mn-tour-veil" style={spot} aria-hidden />
      <div className="mn-tour-ring" style={spot} data-on={box ? '' : undefined} aria-hidden />

      <div
        ref={cardRef}
        className="mn-tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mn-tour-title"
        aria-describedby="mn-tour-body"
        style={{ transform: `translate(${at.x}px, ${at.y}px)` }}
      >
        <div className="mn-tour-pop">
          <button className="mn-icon-btn mn-tour-close" onClick={leave} aria-label="End tour" title="End tour  Esc">
            <X size={14} />
          </button>

          {/* `key` swaps the text in fresh, so it fades in for each step. */}
          <div className="mn-tour-content" key={index} aria-live="polite">
            <div className="mn-tour-count mn-mono">
              {String(index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
            </div>
            <h2 id="mn-tour-title" className="mn-tour-title">
              {step.title}
            </h2>
            <p id="mn-tour-body" className="mn-tour-body">
              {step.body}
            </p>
          </div>

          <footer className="mn-tour-foot">
            <div className="mn-tour-progress" aria-hidden>
              {steps.map((_, i) => (
                <span key={i} data-done={i <= index || undefined} />
              ))}
            </div>
            {index > 0 && (
              <button className="mn-btn mn-btn-ghost mn-tour-back" onClick={back} aria-label="Previous step">
                <ArrowLeft size={14} />
              </button>
            )}
            <button ref={nextRef} className="mn-btn" data-variant="primary" onClick={next}>
              {index === 0 ? 'Start the tour' : last ? 'Finish' : 'Next'}
              {!last && <ArrowRight size={14} />}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
