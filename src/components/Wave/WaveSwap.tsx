/* A card whose form, once submitted, is carried into its result by a wave (wave.ts): on the
 * Rules page, the decision form into the rule's card saying what was done.
 *
 * At rest it shows its children, in one layer. A page starts a wave by handing it a new `run`
 * (see `waveRun`) in the same update that swaps the form for its result. WaveSwap then keeps
 * showing the form as it was (the children from the last render before the run), lays the
 * result over it in a second layer, and runs the wave from one to the other. When it ends,
 * the result moves back into the first layer and the wave is let go.
 *
 * A run that goes away (the person moved on to another rule) stops the wave and shows the
 * result at once. A run comes once: one seen before doesn't play again. */

import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { CARD_WAVE, runWave, type WaveTone } from './wave';
import './WaveSwap.css';

export interface WaveRun {
  /** Where the button that submitted was, in the window, when it was pressed. Left out, the
   *  wave leaves from the submit button inside the form. */
  from?: DOMRect;
  tone?: WaveTone;
}

/** A new run, leaving from `button` if it's given. */
export function waveRun(button?: Element | null, tone?: WaveTone): WaveRun {
  return { from: button?.getBoundingClientRect(), tone };
}

export function WaveSwap({
  run,
  as: Tag = 'div',
  className,
  style,
  children,
  ...rest
}: {
  run: WaveRun | null;
  as?: 'div' | 'section';
  children: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  const root = useRef<HTMLElement>(null);
  const first = useRef<HTMLDivElement>(null);
  const second = useRef<HTMLDivElement>(null);
  // What showed in the last render at rest: the form, when a run arrives.
  const calm = useRef<ReactNode>(children);
  const [seen, setSeen] = useState(run);
  // The last run that played, so one that goes and comes back doesn't play again.
  const [played, setPlayed] = useState(run);
  const [held, setHeld] = useState<{ run: WaveRun; view: ReactNode } | null>(null);

  if (run !== seen) {
    setSeen(run);
    const fresh = run !== null && run !== played;
    if (fresh) setPlayed(run);
    setHeld(fresh ? { run, view: calm.current } : null);
  } else if (!held) {
    calm.current = children;
  }

  useLayoutEffect(() => {
    const el = root.current;
    const a = first.current;
    const b = second.current;
    if (!held || !el || !a || !b) return;
    const box = el.getBoundingClientRect();
    const r = held.run.from;
    const source = r ? { x: r.x - box.x, y: r.y - box.y, w: r.width, h: r.height } : a.querySelector('[type="submit"]');
    return runWave(el, a, b, { source, tone: held.run.tone, style: CARD_WAVE, done: () => setHeld(null) });
  }, [held]);

  return (
    <Tag ref={root as never} className={className ? `mn-wave ${className}` : 'mn-wave'} data-running={held ? '' : undefined} style={{ ...style, display: 'grid' }} {...rest}>
      <div ref={first} className="mn-wave-layer">
        {held ? held.view : children}
      </div>
      {held && (
        <div ref={second} className="mn-wave-layer">
          {children}
        </div>
      )}
    </Tag>
  );
}
