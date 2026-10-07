/* Finding rules: the status tabs, search, sort, and the sidebar's groups with their counts. */

import { GROUPS, SERVICE_GROUPS, groupById, serviceGroupById } from '../data/mockData';
import { SOURCE_LABEL } from './labels';
import type { Rule, RuleStatus } from './types';

export type StatusFilter = 'all' | RuleStatus;
export type SortKey = 'confidence' | 'purity' | 'incidents' | 'updated' | 'name';
export type SortDir = 'asc' | 'desc';
/** What the sidebar lists and filters by. */
export type GroupBy = 'assignment' | 'service';

/** What the user has chosen in the list: tab, search text, group and sort. */
export interface ViewState {
  status: StatusFilter;
  query: string;
  groupBy: GroupBy;
  /** An assignment group or a service group, whichever `groupBy` says. */
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

export const GROUP_BY_LABEL: Record<GroupBy, { tab: string; heading: string; one: string }> = {
  assignment: { tab: 'Assignment', heading: 'Assignment groups', one: 'an assignment group' },
  service: { tab: 'Service', heading: 'Service groups', one: 'a service group' },
};

export const GROUP_BYS = Object.keys(GROUP_BY_LABEL) as GroupBy[];

/** The id of the group a rule falls under, in the sidebar's current grouping. */
export const groupKey = (rule: Rule, by: GroupBy) =>
  by === 'service' ? groupById(rule.groupId).serviceGroupId : rule.groupId;

/** The name of that group, for the rule's row. */
export const groupName = (rule: Rule, by: GroupBy) =>
  by === 'service' ? serviceGroupById(groupKey(rule, by)).name : groupById(rule.groupId).name;

/** A group's name, given which kind of group its id belongs to. */
export const groupLabel = (by: GroupBy, id: string) => (by === 'service' ? serviceGroupById(id) : groupById(id)).name;

/** The name of the group the list is filtered to. */
export const scopeName = ({ groupBy, groupId }: ViewState) => (groupId === 'all' ? 'All groups' : groupLabel(groupBy, groupId));

/** Every word of the query must appear somewhere: ID, name, group, service group, source or conditions. */
export function matches(rule: Rule, query: string) {
  if (!query) return true;
  const g = groupById(rule.groupId);
  const haystack = [
    rule.id,
    rule.name,
    g.name,
    g.unit,
    serviceGroupById(g.serviceGroupId).name,
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

/** Each group with how many rules it has, and how many are waiting for a decision.
 * `search` is the text the sidebar's search box matches against. */
export function groupCounts(rules: Rule[], by: GroupBy) {
  const groups =
    by === 'service'
      ? SERVICE_GROUPS.map((s) => ({
          id: s.id,
          name: s.name,
          // A service group is also found by the assignment groups inside it.
          search: [s.name, ...GROUPS.filter((g) => g.serviceGroupId === s.id).map((g) => g.name)].join(' '),
        }))
      : GROUPS.map((g) => ({ id: g.id, name: g.name, search: `${g.name} ${g.unit}` }));
  return groups.map((group) => {
    const inGroup = rules.filter((r) => groupKey(r, by) === group.id);
    return { group, total: inGroup.length, proposed: inGroup.filter((r) => r.status === 'proposed').length };
  });
}

/** The groups in the order the picker lists them: those waiting on a decision first, then the busiest. */
export function rankedGroups(rules: Rule[], by: GroupBy) {
  return groupCounts(rules, by).sort(
    (a, b) => Number(b.proposed > 0) - Number(a.proposed > 0) || b.total - a.total || a.group.name.localeCompare(b.group.name),
  );
}
