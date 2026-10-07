/* The list's view: only what the user chose (tab, search, group, sort) is stored.
 * The visible rules and the tab counts are worked out from it on every change. */

import { useMemo, useState } from 'react';
import { groupKey, matches, sortRules, type ViewState } from '../model/browse';
import type { Rule } from '../model/types';

export function useRuleView(rules: Rule[]) {
  const [view, setView] = useState<ViewState>({
    status: 'all',
    query: '',
    groupBy: 'assignment',
    groupId: 'all',
    sort: 'updated',
    dir: 'desc',
  });

  // Group and search first, so the tab counts describe what the search found.
  const scoped = useMemo(
    () =>
      rules.filter(
        (r) => (view.groupId === 'all' || groupKey(r, view.groupBy) === view.groupId) && matches(r, view.query),
      ),
    [rules, view.groupBy, view.groupId, view.query],
  );

  const counts = useMemo(() => {
    const c = { all: scoped.length, active: 0, inactive: 0, proposed: 0 };
    scoped.forEach((r) => c[r.status]++);
    return c;
  }, [scoped]);

  // Then the status tab, then the sort.
  const visible = useMemo(
    () => sortRules(view.status === 'all' ? scoped : scoped.filter((r) => r.status === view.status), view.sort, view.dir),
    [scoped, view.status, view.sort, view.dir],
  );

  /** Change part of the view, e.g. `update({ query: 'reactor' })`. */
  const update = (patch: Partial<ViewState>) => setView((v) => ({ ...v, ...patch }));

  return { view, update, visible, counts };
}
