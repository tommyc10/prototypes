/* Finding rules: the status tabs, search, sort and per-group counts. */

import { GROUPS, groupById } from '../data/mockData';
import { SOURCE_LABEL } from './labels';
import type { Rule, RuleStatus } from './types';

export type StatusFilter = 'all' | RuleStatus;
export type SortKey = 'confidence' | 'purity' | 'incidents' | 'updated' | 'name';
export type SortDir = 'asc' | 'desc';

/** What the user has chosen in the list: tab, search text, group and sort. */
export interface ViewState {
  status: StatusFilter;
  query: string;
  groupId: string | 'all';
  sort: SortKey;
  dir: SortDir;
}

export const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'proposed', label: 'Proposed' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

export const SORT_LABEL: Record<SortKey, string> = {
  confidence: 'Confidence',
  purity: 'Purity',
  incidents: 'Incidents',
  updated: 'Last change',
  name: 'Name',
};

export const SORT_KEYS = Object.keys(SORT_LABEL) as SortKey[];

/** Every word of the query must appear somewhere: ID, name, group, source or conditions. */
export function matches(rule: Rule, query: string) {
  if (!query) return true;
  const g = groupById(rule.groupId);
  const haystack = [
    rule.id,
    rule.name,
    g.name,
    g.unit,
    SOURCE_LABEL[rule.source],
    rule.sourceDetail,
    ...rule.evidence.conditions.map((c) => `${c.field} ${c.value}`),
  ]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function sortRules(rules: Rule[], key: SortKey, dir: SortDir) {
  const m = dir === 'asc' ? 1 : -1;
  return [...rules].sort((a, b) => {
    switch (key) {
      case 'confidence':
        return (a.confidence - b.confidence) * m;
      case 'purity':
        return (a.purity - b.purity) * m;
      case 'incidents':
        return (a.incidentCount - b.incidentCount) * m;
      case 'updated':
        return a.updatedAt.localeCompare(b.updatedAt) * m;
      case 'name':
        return a.name.localeCompare(b.name) * m;
    }
  });
}

/** Each group with how many rules it has, and how many are waiting for a decision. */
export function groupCounts(rules: Rule[]) {
  return GROUPS.map((group) => {
    const inGroup = rules.filter((r) => r.groupId === group.id);
    return { group, total: inGroup.length, proposed: inGroup.filter((r) => r.status === 'proposed').length };
  });
}
