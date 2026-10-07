/* The stream, as the page sees it: the last hour of alerts, kept up to date.
 *
 * The prototype's clock is frozen (lib/clock.ts), so "now" here is that moment plus however
 * long the page has been open. In the real app this hook subscribes to the alert feed, and
 * `clock` is just Date.now.
 *
 * `clock()` is the exact time, for the chart, which redraws every frame. `now` is state and
 * only changes when an alert arrives or the minute turns, so React re-renders about once
 * every few seconds instead of sixty times a second. */

import { useEffect, useMemo, useState } from 'react';
import { NOW } from '../../../lib/clock';
import { useRulesStore } from '../../rule-management/hooks/useRulesStore';
import { MINUTE, WINDOW, alertsBetween } from '../data/mockData';
import { resolve } from '../model/stream';

const opened = performance.now();

/** The stream's current time, in milliseconds. */
export const clock = () => NOW.getTime() + (performance.now() - opened);

export function useAlertStream() {
  const rules = useRulesStore((s) => s.rules);
  const [now, setNow] = useState(clock);

  useEffect(() => {
    let shown = now;
    const timer = setInterval(() => {
      const t = clock();
      const arrived = alertsBetween(shown, t).length > 0;
      if (arrived || Math.floor(t / MINUTE) !== Math.floor(shown / MINUTE)) {
        shown = t;
        setNow(t);
      }
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const alerts = useMemo(() => resolve(alertsBetween(now - WINDOW, now), rules), [now, rules]);
  return { now, alerts };
}
