/* Overnight suggestions: patterns the rule engine found in last night's incidents that no
 * rule covers yet. A suggestion is not a rule. A person either proposes it, which makes it one
 * (waiting for approval like any other), or dismisses it.
 * Plain functions with no React in them, like policy.ts. */

import type { Condition, Resolution, Rule, RuleSource } from './types';

/** One incident from last night that sits near a pattern: matched by it, or a near miss. */
export interface NightIncident {
  id: string;
  /** Minutes after 22:00, when the night starts. */
  minute: number;
  ci: string;
  title: string;
  resolution: Resolution;
  minutesOpen: number;
  /** The suggestion's conditions (by index) this incident does not meet. */
  fails: number[];
  /** Its value for the condition that carries the threshold. */
  metric: number;
}

/** The one condition with a number in it that a person can tighten. Always a "less than". */
export interface Threshold {
  /** Which condition it is. */
  index: number;
  unit: string;
  suggested: number;
  /** A tighter value that leaves every real incident visible, where one exists. */
  safe?: number;
}

export interface Suggestion {
  id: string;
  /** The rule it becomes if proposed. */
  ruleId: string;
  name: string;
  groupId: string;
  source: RuleSource;
  sourceDetail: string;
  confidence: number;
  /** How many of the last seven nights the pattern appeared on. */
  nights: number;
  summary: string;
  /** The threshold condition's value is filled in from `threshold`. */
  conditions: Condition[];
  threshold: Threshold;
  medianClear: string;
  recurrence: string;
  /** Every incident near the pattern. */
  pool: NightIncident[];
}

/** What a suggestion catches at a given threshold. */
export interface SuggestionMatch {
  matched: NightIncident[];
  /** The matched incidents a person had to work: the ones a rule must not hide. */
  real: NightIncident[];
  noise: number;
  first: number;
  last: number;
  /** Matched incidents per half hour, 22:00 to 06:00. */
  halfHours: number[];
}

export const isReal = (resolution: Resolution) => resolution === 'worked' || resolution === 'escalated';

/** 22:00 is minute 0. */
export function nightClock(minute: number) {
  const t = (22 * 60 + Math.round(minute)) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

export const thresholdLabel = (s: Suggestion, value: number) => `${value}${s.threshold.unit}`;

/** The conditions as they read at this threshold. */
export const conditionsAt = (s: Suggestion, threshold: number): Condition[] =>
  s.conditions.map((c, i) => (i === s.threshold.index ? { ...c, value: thresholdLabel(s, threshold) } : c));

export function matchSuggestion(s: Suggestion, threshold: number): SuggestionMatch {
  const matched = s.pool.filter((i) => i.fails.length === 0 && i.metric < threshold);
  const real = matched.filter((i) => isReal(i.resolution));
  const halfHours = Array.from({ length: 16 }, () => 0);
  matched.forEach((i) => halfHours[Math.min(15, Math.floor(i.minute / 30))]++);
  return {
    matched,
    real,
    noise: matched.length - real.length,
    first: matched[0]?.minute ?? 0,
    last: matched[matched.length - 1]?.minute ?? 0,
    halfHours,
  };
}

/** Whether tightening would help: it hides a real incident and a safer threshold exists. */
export const canTighten = (s: Suggestion, match: SuggestionMatch, threshold: number) =>
  match.real.length > 0 && s.threshold.safe !== undefined && threshold > s.threshold.safe;

/** The suggestion in the shape of the rule it would become, so the page's own sections
 * (stats, evidence, impact, the incident table) can show it. `foundAt` is the refresh that
 * found it; `nightStart` is the 22:00 its incidents are counted from. */
export function asRule(s: Suggestion, match: SuggestionMatch, threshold: number, foundAt: string, nightStart: string): Rule {
  const matched = match.matched.length;
  // Twelve weeks, as the page charts them: nothing, then the nights it has been seen on.
  const weekly = Array.from({ length: 12 }, (_, week) =>
    week === 11 ? matched * Math.min(s.nights, 4) : week === 10 ? matched * Math.max(0, s.nights - 4) : 0,
  );
  // The sample leads with the incidents that needed a person: those are the ones to read.
  const sample = [...match.real, ...match.matched.filter((i) => !isReal(i.resolution))].slice(0, 9);
  const start = new Date(nightStart).getTime();
  return {
    id: s.id,
    name: s.name,
    status: 'proposed',
    groupId: s.groupId,
    confidence: s.confidence,
    purity: matched ? match.noise / matched : 0,
    incidentCount: weekly[10] + weekly[11],
    source: s.source,
    sourceDetail: s.sourceDetail,
    createdAt: foundAt,
    updatedAt: foundAt,
    evidence: {
      summary: `${matched} incidents last night, between ${nightClock(match.first)} and ${nightClock(match.last)}. ${s.summary}`,
      conditions: conditionsAt(s, threshold),
      window: `Last ${s.nights} nights`,
      weekly,
      medianClear: s.medianClear,
      recurrence: s.recurrence,
      escalations: match.matched.filter((i) => i.resolution === 'escalated').length,
    },
    related: sample.map((i) => ({
      id: i.id,
      title: i.title,
      ci: i.ci,
      openedAt: new Date(start + i.minute * 60_000).toISOString(),
      resolution: i.resolution,
      minutesOpen: i.minutesOpen,
    })),
    audit: [],
  };
}

/** The rule a suggestion becomes when `actor` proposes it at `at`. */
export function proposedFrom(s: Suggestion, preview: Rule, match: SuggestionMatch, actor: string, at: string): Rule {
  return {
    ...preview,
    id: s.ruleId,
    updatedAt: at,
    audit: [
      {
        at: preview.createdAt,
        actor: s.sourceDetail,
        action: 'proposed',
        reason: `Found in the overnight refresh: ${match.matched.length} incidents with the same shape, ${match.noise} of them noise.`,
      },
      { at, actor, action: 'proposed', reason: 'Put forward from the overnight suggestions for approval.' },
    ],
  };
}
