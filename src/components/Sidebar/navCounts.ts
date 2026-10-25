/* The numbers beside the sidebar's pages: only the ones that ask something of a person, so
 * most rows stay bare. Each is worked out from that page's own data, the same way the page
 * works it out, so the sidebar never disagrees with the page it points to.
 *
 * In the real app each of these is that page's own query, kept warm by the data layer. */

import { useMemo } from 'react';
import { NOW } from '../../lib/clock';
import { PEOPLE } from '../../pages/access/data/mockData';
import { SAMPLES } from '../../pages/change-windows/data/mockData';
import { statusOf } from '../../pages/change-windows/model/windows';
import { lifecycles } from '../../pages/incidents/data/mockData';
import { useRulesStore } from '../../pages/rule-management/hooks/useRulesStore';

export interface NavCounts {
  /** Real incidents with the team right now. */
  open: number;
  /** Change windows past their planned end. */
  late: number;
  /** Proposed rules waiting for a decision. */
  waiting: number;
  /** Invitations nobody has accepted yet. */
  invited: number;
}

export function useNavCounts(): NavCounts {
  const rules = useRulesStore((s) => s.rules);
  return useMemo(() => {
    const now = NOW.getTime();
    // The change windows page lets the prototype switch estates; count the one it's showing.
    const windows = SAMPLES[sessionStorage.getItem('mn-windows-sample') === 'busy' ? 'busy' : 'tidy'];
    return {
      open: lifecycles(rules).filter((l) => l.end === 'enriching').length,
      late: windows.filter((w) => statusOf(w, now) === 'overrunning').length,
      waiting: rules.filter((r) => r.status === 'proposed').length,
      invited: PEOPLE.filter((p) => p.status === 'invited').length,
    };
  }, [rules]);
}
