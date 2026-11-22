/* The handoff from sign-in to the app. When sign-in succeeds, a grey wave (wave.ts) rises from
 * the Sign in button and carries the sign-in page into the page behind it, once per sign-in.
 *
 * Both pages lie in one grid cell (`mn-stage` in shell.css): the app's page underneath, the
 * sign-in page over it. Once the wave has gone App unmounts the sign-in page, and the app runs
 * without it. The page underneath is the real page, mounted once, so nothing redraws after. */

import { useEffect, useRef, useState } from 'react';
import { WINDOW_WAVE, runWave } from './wave';

/**
 * `start(button)` begins a handoff from that button. `ready` says the page underneath has
 * mounted (the address has moved off #/login). While `active`, App keeps the sign-in page
 * mounted over the app and holds back what floats over the app (Aide, the Halloween card).
 */
export function useHandoff(ready: boolean) {
  const stage = useRef<HTMLDivElement>(null);
  const from = useRef<HTMLDivElement>(null);
  const to = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!source || !ready || !stage.current || !from.current || !to.current) return;
    return runWave(stage.current, from.current, to.current, { source, style: WINDOW_WAVE, done: () => setSource(null) });
  }, [source, ready]);

  return { stage, from, to, active: source !== null, start: setSource };
}
