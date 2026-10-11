/* The station, as the home page sees it: the last hour of alerts (kept up to date), the
 * rules and the change windows, read into a queue and a reading per group. */

import { useMemo } from 'react';
import { NOW } from '../../../lib/clock';
import { useAlertStream } from '../../alerts/hooks/useAlertStream';
import { rulesAtWork, tally } from '../../alerts/model/stream';
import { SAMPLES } from '../../change-windows/data/mockData';
import { sortWindows } from '../../change-windows/model/windows';
import { useRulesStore } from '../../rule-management/hooks/useRulesStore';
import { groupReadings, needs, type Station } from '../model/station';

export function useStation(): Station {
  const rules = useRulesStore((s) => s.rules);
  const { now, alerts } = useAlertStream();
  // The change calendar runs on the prototype's frozen clock, and shows whichever sample
  // estate was last picked on its own page, so this page and that one agree.
  const windowsNow = NOW.getTime();
  const windows = useMemo(
    () => sortWindows(SAMPLES[sessionStorage.getItem('mn-windows-sample') === 'busy' ? 'busy' : 'tidy'], windowsNow),
    [windowsNow],
  );

  const counts = useMemo(() => tally(alerts), [alerts]);
  const atWork = useMemo(() => rulesAtWork(alerts), [alerts]);
  const queue = useMemo(() => needs(windows, windowsNow, rules, atWork), [windows, windowsNow, rules, atWork]);
  const groups = useMemo(() => groupReadings(alerts, now, windows, windowsNow, rules), [alerts, now, windows, windowsNow, rules]);

  return { now, alerts, counts, queue, groups };
}
