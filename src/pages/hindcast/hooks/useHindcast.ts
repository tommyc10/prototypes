/* The hindcast for the chosen scope. Here it's worked out on the spot from the mock data and
 * the rules as they stand (so approving a rule on the Rules page changes it). In the real app
 * this becomes a data-fetching query keyed on the scope; while a new scope loads, keep showing
 * the previous report (dimmed) instead of a skeleton, so the page doesn't jump. */

import { useMemo } from 'react';
import { useRulesStore } from '../../rule-management/hooks/useRulesStore';
import { buildReport } from '../data/mockData';
import type { Lookback } from '../model/types';

export function useHindcast(serviceId: string, weeks: Lookback) {
  const rules = useRulesStore((s) => s.rules);
  return useMemo(() => buildReport({ serviceId, weeks }, rules), [serviceId, weeks, rules]);
}
