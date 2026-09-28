import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import {
  CURRENT_USER,
  GROUPS,
  NOW,
  RULES,
  SOURCE_LABEL,
  groupById,
  type AuditAction,
  type Rule,
  type RuleStatus,
} from './data';

/* ---------- governance policy ---------- */

export const LOW_CONFIDENCE = 0.6;
export const MIN_REASON = 12;

export type RuleAction = 'approve' | 'reject' | 'activate' | 'deactivate';

export const ACTION_LABEL: Record<RuleAction, string> = {
  approve: 'Approve',
  reject: 'Reject',
  activate: 'Activate',
  deactivate: 'Deactivate',
};

export const ACTION_PAST: Record<RuleAction, AuditAction> = {
  approve: 'approved',
  reject: 'rejected',
  activate: 'activated',
  deactivate: 'deactivated',
};

const NEXT_STATUS: Record<RuleAction, RuleStatus> = {
  approve: 'active',
  reject: 'inactive',
  activate: 'active',
  deactivate: 'inactive',
};

export function actionsFor(rule: Rule): RuleAction[] {
  if (rule.status === 'proposed') return ['approve', 'reject'];
  if (rule.status === 'active') return ['deactivate'];
  return ['activate'];
}

export const isLowConfidence = (rule: Rule) => rule.confidence < LOW_CONFIDENCE;
export const turnsOn = (action: RuleAction) => action === 'approve' || action === 'activate';
export const needsOverride = (rule: Rule, action: RuleAction) => turnsOn(action) && isLowConfidence(rule);

export function wasRejected(rule: Rule) {
  return rule.status === 'inactive' && rule.audit[rule.audit.length - 1]?.action === 'rejected';
}

export function validate(rule: Rule, action: RuleAction, reason: string, override: boolean) {
  const errors: { reason?: string; override?: string } = {};
  const len = reason.trim().length;
  if (len === 0) errors.reason = 'A written reason is required for every rule change.';
  else if (len < MIN_REASON) errors.reason = `Add a little more detail (${MIN_REASON - len} more characters).`;
  if (needsOverride(rule, action) && !override)
    errors.override = `Confidence is ${pct(rule.confidence)}, below the ${pct(LOW_CONFIDENCE)} floor. Confirm the override to continue.`;
  return { ok: !errors.reason && !errors.override, errors };
}

/* ---------- store ---------- */

interface RulesState {
  rules: Rule[];
  apply: (id: string, action: RuleAction, reason: string, override: boolean) => Rule;
  reset: () => void;
}

const fresh = () => structuredClone(RULES);

export const useRules = create<RulesState>((set, get) => ({
  rules: fresh(),
  apply: (id, action, reason, override) => {
    // Stamped at the prototype's fixed "now" so new entries read as "just now".
    const at = NOW.toISOString();
    let updated!: Rule;
    set({
      rules: get().rules.map((r) => {
        if (r.id !== id) return r;
        updated = {
          ...r,
          status: NEXT_STATUS[action],
          updatedAt: at,
          audit: [
            ...r.audit,
            {
              at,
              actor: CURRENT_USER,
              action: ACTION_PAST[action],
              reason: reason.trim(),
              override: needsOverride(r, action) ? override : undefined,
            },
          ],
        };
        return updated;
      }),
    });
    return updated;
  },
  reset: () => set({ rules: fresh() }),
}));

/** Each variant starts from the same untouched dataset. */
export function useFreshRules() {
  const reset = useRules((s) => s.reset);
  useEffect(() => reset(), [reset]);
  return useRules((s) => s.rules);
}

/* ---------- browse: filter, search, sort ---------- */

export type StatusFilter = 'all' | RuleStatus;
export type SortKey = 'confidence' | 'purity' | 'incidents' | 'updated' | 'name';
export type SortDir = 'asc' | 'desc';

export const SORT_LABEL: Record<SortKey, string> = {
  confidence: 'Confidence',
  purity: 'Purity',
  incidents: 'Incidents',
  updated: 'Last change',
  name: 'Name',
};

export interface ViewState {
  status: StatusFilter;
  query: string;
  groupId: string | 'all';
  sort: SortKey;
  dir: SortDir;
}

export function matches(rule: Rule, q: string) {
  if (!q) return true;
  const g = groupById(rule.groupId);
  const hay = [
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
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
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

export function useRuleView(rules: Rule[], initial?: Partial<ViewState>) {
  const [view, setView] = useState<ViewState>({
    status: 'all',
    query: '',
    groupId: 'all',
    sort: 'updated',
    dir: 'desc',
    ...initial,
  });

  const scoped = useMemo(
    () => rules.filter((r) => (view.groupId === 'all' || r.groupId === view.groupId) && matches(r, view.query)),
    [rules, view.groupId, view.query],
  );

  const counts = useMemo(() => {
    const c = { all: scoped.length, active: 0, inactive: 0, proposed: 0 };
    scoped.forEach((r) => c[r.status]++);
    return c;
  }, [scoped]);

  const visible = useMemo(
    () => sortRules(view.status === 'all' ? scoped : scoped.filter((r) => r.status === view.status), view.sort, view.dir),
    [scoped, view.status, view.sort, view.dir],
  );

  const update = (patch: Partial<ViewState>) => setView((v) => ({ ...v, ...patch }));
  const toggleSort = (key: SortKey) =>
    setView((v) => ({ ...v, sort: key, dir: v.sort === key ? (v.dir === 'asc' ? 'desc' : 'asc') : key === 'name' ? 'asc' : 'desc' }));

  return { view, update, toggleSort, visible, counts };
}

export function groupCounts(rules: Rule[]) {
  return GROUPS.map((g) => {
    const rs = rules.filter((r) => r.groupId === g.id);
    return {
      group: g,
      total: rs.length,
      proposed: rs.filter((r) => r.status === 'proposed').length,
      active: rs.filter((r) => r.status === 'active').length,
    };
  });
}

/* ---------- impact backtest (simulated, ~2.4 s) ---------- */

export interface Backtest {
  suppressed: number;
  escalated: number;
  hoursSaved: number;
}

export function useBacktest(rule: Rule | null, enabled: boolean) {
  const [result, setResult] = useState<Backtest | null>(null);
  useEffect(() => {
    setResult(null);
    if (!rule || !enabled) return;
    const t = setTimeout(
      () =>
        setResult({
          suppressed: Math.round(rule.incidentCount * rule.purity),
          escalated: rule.evidence.escalations,
          hoursSaved: Math.round((rule.incidentCount * rule.purity * 9) / 60),
        }),
      2400,
    );
    return () => clearTimeout(t);
  }, [rule, enabled]);
  return result;
}

/* ---------- formatting ---------- */

export const pct = (n: number) => `${Math.round(n * 100)}%`;

export function ago(iso: string) {
  const diff = (NOW.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = Math.floor(diff / 86400);
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function compact(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString('en-GB');
}

export const STATUS_LABEL: Record<RuleStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  proposed: 'Proposed',
};

export function statusLabel(rule: Rule) {
  return wasRejected(rule) ? 'Rejected' : STATUS_LABEL[rule.status];
}
