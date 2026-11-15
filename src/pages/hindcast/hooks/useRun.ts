/* A replay run, as the page sees it: three steps the engine works through (read the tickets,
 * load the logic, match), then the result. Each step's figure shows the moment that step is
 * done, so the page's opening sentence completes itself as the run goes, and the report lands
 * when matching ends. What's on screen from the run before stays (stale, not gone), so a
 * change of scope never flashes the page empty.
 *
 * The prototype computes in a few milliseconds; the steps stand in for the real engine's reads,
 * at the pace a real run takes. A warm run (after the first) is quicker. */

import { useEffect, useRef, useState } from 'react';

export type Run<T> = {
  /** Steps finished, 0 to 3. */
  step: number;
  /** The run in progress, known from the start; read each figure only once its step is done. */
  next: T;
  /** What the report shows: the last finished run, or null before the first one finishes. */
  shown: T | null;
  done: boolean;
};

const COLD = [480, 400, 620];
const WARM = [200, 170, 300];

export function useRun<T>(key: string, compute: () => T): Run<T> {
  const latest = useRef(compute);
  latest.current = compute;
  const [run, setRun] = useState<Run<T>>(() => ({ step: 0, next: compute(), shown: null, done: false }));
  // Warm only once a run has finished, so React's development double-start still reads cold.
  const warm = useRef(false);
  const computedFor = useRef(key);

  useEffect(() => {
    const pace = warm.current ? WARM : COLD;
    const next = computedFor.current === key ? run.next : latest.current();
    computedFor.current = key;
    setRun((r) => ({ step: 0, next, shown: r.shown, done: false }));
    const timers: ReturnType<typeof setTimeout>[] = [];
    let at = 0;
    pace.forEach((ms, i) => {
      at += ms;
      const last = i === pace.length - 1;
      timers.push(
        setTimeout(() => {
          if (last) warm.current = true;
          setRun((r) => ({ ...r, step: i + 1, shown: last ? next : r.shown, done: last }));
        }, at),
      );
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return run;
}
