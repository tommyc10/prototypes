/* The tabs: the rules you're working on. The list is for finding rules;
 * the working set is what you've opened, plus which of those you've decided. */

import { useState } from 'react';
import { INITIAL_OPEN_TABS } from '../data/mockData';

export function useWorkingSet() {
  const [openIds, setOpenIds] = useState<string[]>(INITIAL_OPEN_TABS);
  const [decidedIds, setDecidedIds] = useState<string[]>([]);

  /** Keep a rule open as a tab. */
  const pin = (id: string) => setOpenIds((ids) => (ids.includes(id) ? ids : [...ids, id]));

  /** Close a tab. Returns its neighbour, so closing the tab you're on can move you there. */
  const close = (id: string) => {
    const rest = openIds.filter((x) => x !== id);
    setOpenIds(rest);
    return rest[Math.min(openIds.indexOf(id), rest.length - 1)] ?? null;
  };

  const markDecided = (id: string) => setDecidedIds((ids) => [...ids, id]);

  return { openIds, decidedIds, pin, close, markDecided };
}
