/* Overnight suggestions: patterns the rule engine found in a night's incidents that no rule
 * covers yet. A suggestion is not a rule. A person either proposes it, which makes it one
 * (waiting for approval like any other), or dismisses it. If neither happens within three
 * refreshes it moves to the rules by itself, proposed, so the block only ever holds recent finds.
 *
 * Its life, counted in successful refreshes from the one that found it:
 *   1  it appears under the night that found it
 *   2  it stays under that night. Seeing the pattern again updates its evidence, not its age
 *   3  its night says it moves at the next refresh
 *   4  it becomes a proposed rule, which hides nothing until someone approves it
 * A failed run ages nothing, and running the same night twice counts once.
 *
 * Nights are UTC, 22:00 to 06:00, and every date here is written in UTC so a night keeps its
 * name in every time zone. Plain functions with no React in them, like policy.ts. */

import type { Condition, Resolution, Rule, RuleSource } from './types';

/** How many refreshes a suggestion stays in the overnight block, counted from the one that found it. */
export const REFRESH_WINDOW = 3;

/** One run of the nightly refresh. Only a run that succeeds counts. */
export interface RefreshRun {
  at: string;
  ok: boolean;
  /** Why it failed. */
  note?: string;
}

/** An ISO date → "26 Sept", in UTC: the night's own date wherever the reader is. */
export const nightDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** An ISO date → "06:41", in UTC, the clock the nights are counted in. */
export const nightTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

/** One incident from its night that sits near a pattern: matched by it, or a near miss. */
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
  /** How many refreshes ago it was first found: 0 is this morning's. Seeing it again doesn't reset this. */
  daysAgo: number;
  /** How many refreshes ago it was last seen. Below `daysAgo` when a later night saw it again. */
  lastSeen: number;
  /** The refresh that found it. */
  foundAt: string;
  /** The 22:00 its incidents are counted from. */
  nightStart: string;
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
  return {
    matched,
    real,
    noise: matched.length - real.length,
    first: matched[0]?.minute ?? 0,
    last: matched[matched.length - 1]?.minute ?? 0,
  };
}

/** Whether tightening would help: it hides a real incident and a safer threshold exists. */
export const canTighten = (s: Suggestion, match: SuggestionMatch, threshold: number) =>
  match.real.length > 0 && s.threshold.safe !== undefined && threshold > s.threshold.safe;

/** Its night, as a sentence says it. */
export const nightWords = (s: Suggestion) => (s.daysAgo === 0 ? 'last night' : `on the night of ${nightDate(s.nightStart)}`);

/** Successful refreshes left before it moves to the rules: 3, 2, then 1. */
export const refreshesLeft = (s: Suggestion) => REFRESH_WINDOW - s.daysAgo;

/** When it moves to the rules if nobody decides, as a sentence says it. The date assumes every
 * refresh between now and then succeeds; one that fails pushes it back a night. */
export function movesWords(s: Suggestion) {
  const left = refreshesLeft(s);
  if (left <= 1) return 'at the next refresh';
  const at = new Date(s.foundAt);
  at.setUTCDate(at.getUTCDate() + REFRESH_WINDOW);
  return `in ${left} refreshes (${nightDate(at.toISOString())})`;
}

/** When a later night saw it again, as a sentence says it, or null if none has. */
export function seenAgainWords(s: Suggestion) {
  if (s.lastSeen >= s.daysAgo) return null;
  if (s.lastSeen === 0) return 'last night';
  const night = new Date(s.nightStart);
  night.setUTCDate(night.getUTCDate() + s.daysAgo - s.lastSeen);
  return `on the night of ${nightDate(night.toISOString())}`;
}

/** The suggestion in the shape of the rule it would become, so the page's own sections
 * (stats, evidence, impact, the incident table) can show it. */
export function asRule(s: Suggestion, match: SuggestionMatch, threshold: number): Rule {
  const { foundAt, nightStart } = s;
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
      summary: `${matched} incidents ${nightWords(s)}, between ${nightClock(match.first)} and ${nightClock(match.last)}. ${s.summary}`,
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

/** The rule a suggestion becomes when its time in the block runs out. Proposed, so it hides nothing. */
export function movedFrom(s: Suggestion, preview: Rule, match: SuggestionMatch, movedAt: string): Rule {
  return {
    ...preview,
    id: s.ruleId,
    updatedAt: movedAt,
    fromRefresh: s.nightStart,
    audit: [
      {
        at: preview.createdAt,
        actor: s.sourceDetail,
        action: 'proposed',
        reason: `Found in the overnight refresh: ${match.matched.length} incidents with the same shape, ${match.noise} of them noise.`,
      },
      {
        at: movedAt,
        actor: 'Overnight refresh',
        action: 'proposed',
        reason: `Moved to the rules after ${REFRESH_WINDOW} refreshes with no decision. It waits for approval like any other proposal.`,
      },
    ],
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
