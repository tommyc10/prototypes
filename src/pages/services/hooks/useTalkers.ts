/* Every service's reading over the lookback, kept in step with the rules store: approving a
 * rule on the Rules page moves the counts here too. */

import { useMemo } from 'react';
import { useRulesStore } from '../../rule-management/hooks/useRulesStore';
import { talkers } from '../model/talkers';
import type { Lookback } from '../model/types';

export function useTalkers(weeks: Lookback) {
  const rules = useRulesStore((s) => s.rules);
  return useMemo(() => talkers(rules, weeks), [rules, weeks]);
}
