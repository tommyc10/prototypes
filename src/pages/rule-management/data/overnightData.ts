/* Mock data: what the nightly refreshes found. Each pattern comes with the incidents near it,
 * generated the same way every time. Those from the last three refreshes wait in the overnight
 * block; older ones nobody decided on have moved to the rules. Like mockData.ts, this is a file
 * the real backend replaces. */

import { NOW } from '../../../lib/clock';
import { shortDate } from '../../../lib/format';
import type { Condition, Resolution, RuleSource } from '../model/types';
import { REFRESH_WINDOW, asRule, matchSuggestion, movedFrom, type NightIncident, type Suggestion, type Threshold } from '../model/suggestions';
import type { Rule } from '../model/types';

function atDay(daysAgo: number, hours: number, minutes = 0) {
  const at = new Date(NOW);
  at.setUTCDate(at.getUTCDate() - daysAgo);
  at.setUTCHours(hours, minutes, 0, 0);
  return at.toISOString();
}

/** The refresh on a morning, and the 22:00 before it that its night is counted from. */
const refreshOf = (daysAgo: number) => atDay(daysAgo, 6, 2);
const nightOf = (daysAgo: number) => atDay(daysAgo + 1, 22);

/** A night the block has room for. */
export interface RefreshNight {
  daysAgo: number;
  /** "Last night", or the day it fell on. */
  label: string;
  date: string;
  /** Every incident that came in that night, in a pattern or not. */
  total: number;
}

const NIGHT_TOTALS = [214, 187, 203];

export const REFRESH_NIGHTS: RefreshNight[] = NIGHT_TOTALS.slice(0, REFRESH_WINDOW).map((total, daysAgo) => ({
  daysAgo,
  label: daysAgo === 0 ? 'Last night' : new Date(nightOf(daysAgo)).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
  date: shortDate(nightOf(daysAgo)),
  total,
}));

/* ---------- deterministic generation helpers ---------- */

type Rand = () => number;

function mulberry32(seed: number): Rand {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NIGHT_MINUTES = 480;
const normal = (r: Rand, mean: number, sd: number) => mean + ((r() + r() + r() + r() - 2) / 0.577) * sd;

const MINUTES_OPEN: Record<Resolution, [number, number]> = {
  'auto-cleared': [3, 7],
  'closed-no-action': [8, 22],
  duplicate: [2, 6],
  worked: [25, 90],
  escalated: [60, 180],
};

/** `n` incidents that ended the same way, with their threshold value somewhere in `metric`. */
interface Batch {
  n: number;
  resolution: Resolution;
  metric: [number, number];
  fails?: number[];
}

interface Spec {
  id: string;
  name: string;
  groupId: string;
  source: RuleSource;
  sourceDetail: string;
  confidence: number;
  nights: number;
  /** Which refresh found it, counting back from this morning's. */
  daysAgo: number;
  summary: string;
  conditions: Condition[];
  threshold: Threshold;
  medianClear: string;
  recurrence: string;
  title: string;
  cis: string[];
  decimals: number;
  /** When in the night one of its incidents comes in. */
  when: (r: Rand) => number;
  batches: Batch[];
}

const SPECS: Spec[] = [
  {
    id: 'SUG-01',
    name: 'Hangar bay 2 magnetic shield flicker',
    groupId: 'hangar',
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.2',
    confidence: 0.96,
    nights: 7,
    daysAgo: 0,
    summary: 'The shield drops for a moment each time a TIE crosses it, then recovers on its own.',
    conditions: [
      { field: 'ci', op: 'matches', value: 'hangar-02-magshield-*' },
      { field: 'alert.duration', op: '<', value: '' },
      { field: 'metric.field_strength_pct', op: '>', value: '94' },
    ],
    threshold: { index: 1, unit: 's', suggested: 2 },
    medianClear: '1.1 s',
    recurrence: 'Each TIE launch, 23:30 to 02:40',
    title: 'Magnetic shield field flicker',
    cis: ['hangar-02-magshield-a', 'hangar-02-magshield-b', 'hangar-02-magshield-c'],
    decimals: 1,
    when: (r) => normal(r, 200, 45),
    batches: [
      { n: 46, resolution: 'auto-cleared', metric: [0.2, 1.8] },
      { n: 3, resolution: 'auto-cleared', metric: [2.5, 5] },
      { n: 2, resolution: 'closed-no-action', metric: [3, 8] },
      { n: 1, resolution: 'worked', metric: [6, 7] },
      { n: 2, resolution: 'worked', metric: [0.4, 1.6], fails: [2] },
      { n: 1, resolution: 'escalated', metric: [0.5, 1.5], fails: [2] },
    ],
  },
  {
    id: 'SUG-02',
    name: 'Garbage chute 5 hatch sensor duplicates',
    groupId: 'facilities',
    source: 'duplicate-detector',
    sourceDetail: 'Duplicate detector v2.0',
    confidence: 0.93,
    nights: 5,
    daysAgo: 1,
    summary: 'One hatch sensor raises the same fault every few minutes until someone closes the first ticket.',
    conditions: [
      { field: 'ci', op: '=', value: 'chute-05-hatch-sensor' },
      { field: 'short_description', op: 'contains', value: 'hatch ajar' },
      { field: 'dedupe.gap', op: '<', value: '' },
    ],
    threshold: { index: 2, unit: 'm', suggested: 10 },
    medianClear: '4 min',
    recurrence: 'Two bursts a night',
    title: 'Chute 5 hatch ajar',
    cis: ['chute-05-hatch-sensor'],
    decimals: 0,
    when: (r) => (r() < 0.5 ? normal(r, 70, 7) : normal(r, 380, 7)),
    batches: [
      { n: 29, resolution: 'duplicate', metric: [1, 8] },
      { n: 2, resolution: 'closed-no-action', metric: [1, 8] },
      { n: 3, resolution: 'closed-no-action', metric: [12, 28] },
      { n: 2, resolution: 'worked', metric: [14, 28] },
      { n: 3, resolution: 'worked', metric: [1, 8], fails: [1] },
    ],
  },
  {
    id: 'SUG-03',
    name: 'Shield generator phase drift during rotation',
    groupId: 'reactor',
    source: 'correlation-engine',
    sourceDetail: 'Correlation engine 2.9',
    confidence: 0.71,
    nights: 6,
    daysAgo: 0,
    summary: 'Phase drifts a fraction of a degree each time the station rotates, every 96 minutes, then settles.',
    conditions: [
      { field: 'ci.class', op: '=', value: 'shield-generator' },
      { field: 'metric.phase_drift_deg', op: '<', value: '' },
      { field: 'station.state', op: '=', value: 'rotation' },
    ],
    // One escalated incident drifted 0.46°: under the suggested 0.5°, over the safe 0.4°.
    threshold: { index: 1, unit: '°', suggested: 0.5, safe: 0.4 },
    medianClear: '38 s',
    recurrence: 'Every 96 min, on rotation',
    title: 'Shield generator phase drift',
    cis: ['shieldgen-north-01', 'shieldgen-north-02', 'shieldgen-equator-04'],
    decimals: 2,
    when: (r) => normal(r, 40 + 96 * Math.floor(r() * 5), 6),
    batches: [
      { n: 26, resolution: 'auto-cleared', metric: [0.08, 0.38] },
      { n: 1, resolution: 'escalated', metric: [0.46, 0.46] },
      { n: 2, resolution: 'auto-cleared', metric: [0.55, 0.9] },
      { n: 3, resolution: 'worked', metric: [0.6, 0.95] },
      { n: 3, resolution: 'worked', metric: [0.1, 0.38], fails: [2] },
    ],
  },
  {
    id: 'SUG-04',
    name: 'Docking tractor lock retries that pass',
    groupId: 'tractor',
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.2',
    confidence: 0.88,
    nights: 6,
    daysAgo: 2,
    summary: 'The tractor lock misses on its first attempt around shift change and passes on the retry.',
    conditions: [
      { field: 'ci', op: 'matches', value: 'dock-tractor-*' },
      { field: 'retry.result', op: '=', value: 'pass' },
      { field: 'retry.count', op: '<', value: '' },
    ],
    threshold: { index: 2, unit: '', suggested: 3 },
    medianClear: '12 s',
    recurrence: 'Around the 02:00 shift change',
    title: 'Tractor lock retry',
    cis: ['dock-tractor-327', 'dock-tractor-328', 'dock-tractor-94'],
    decimals: 0,
    when: (r) => normal(r, 240, 25),
    batches: [
      { n: 15, resolution: 'auto-cleared', metric: [1, 2] },
      { n: 4, resolution: 'closed-no-action', metric: [1, 2] },
      { n: 3, resolution: 'auto-cleared', metric: [3, 5] },
      { n: 4, resolution: 'worked', metric: [1, 2], fails: [1] },
    ],
  },
  {
    id: 'SUG-05',
    name: 'Deck 9 replicator temperature warnings at breakfast',
    groupId: 'lifesupport',
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.2',
    confidence: 0.64,
    nights: 2,
    daysAgo: 0,
    summary: 'The mess hall replicators run a few degrees warm at breakfast. Seen on two nights so far.',
    conditions: [
      { field: 'ci', op: 'matches', value: 'deck-09-replicator-*' },
      { field: 'alert.type', op: '=', value: 'temp_warning' },
      { field: 'metric.temp_over_c', op: '<', value: '' },
    ],
    // Two were worked at just over 3°C, so 3 is the threshold that leaves them alone.
    threshold: { index: 2, unit: '°C', suggested: 4, safe: 3 },
    medianClear: '11 min',
    recurrence: 'Breakfast, 05:00 to 06:00',
    title: 'Replicator over temperature',
    cis: ['deck-09-replicator-02', 'deck-09-replicator-05', 'deck-09-replicator-06'],
    decimals: 1,
    when: (r) => normal(r, 440, 16),
    batches: [
      { n: 10, resolution: 'closed-no-action', metric: [0.5, 2.8] },
      { n: 2, resolution: 'worked', metric: [3.2, 3.7] },
      { n: 3, resolution: 'worked', metric: [5, 11] },
    ],
  },
  {
    id: 'SUG-06',
    name: 'Turbolift 7 door sensor retries',
    groupId: 'facilities',
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.2',
    confidence: 0.9,
    nights: 3,
    daysAgo: 2,
    summary: 'The door sensor misses a read as the car arrives and passes on the next one.',
    conditions: [
      { field: 'ci', op: 'matches', value: 'turbolift-07-door-*' },
      { field: 'retry.result', op: '=', value: 'pass' },
      { field: 'retry.count', op: '<', value: '' },
    ],
    threshold: { index: 2, unit: '', suggested: 3 },
    medianClear: '9 s',
    recurrence: 'Around shift changes',
    title: 'Turbolift door retry',
    cis: ['turbolift-07-door-a', 'turbolift-07-door-b'],
    decimals: 0,
    when: (r) => normal(r, 240, 30),
    batches: [
      { n: 5, resolution: 'auto-cleared', metric: [1, 2] },
      { n: 1, resolution: 'worked', metric: [3, 4] },
    ],
  },
  {
    id: 'SUG-07',
    name: 'HoloNet relay 4 heartbeat gaps',
    groupId: 'holonet',
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.2',
    confidence: 0.89,
    nights: 5,
    daysAgo: 3,
    summary: 'The relay misses a heartbeat during its key rotation and recovers on the next beat.',
    conditions: [
      { field: 'ci', op: 'matches', value: 'holonet-relay-04-*' },
      { field: 'alert.duration', op: '<', value: '' },
    ],
    threshold: { index: 1, unit: 's', suggested: 5 },
    medianClear: '3 s',
    recurrence: 'Nightly key rotation',
    title: 'Relay heartbeat gap',
    cis: ['holonet-relay-04-a', 'holonet-relay-04-b'],
    decimals: 1,
    when: (r) => normal(r, 180, 40),
    batches: [
      { n: 9, resolution: 'auto-cleared', metric: [0.5, 4] },
      { n: 1, resolution: 'worked', metric: [6, 9] },
    ],
  },
  {
    id: 'SUG-08',
    name: 'Cell block door controller chatter',
    groupId: 'detention',
    source: 'duplicate-detector',
    sourceDetail: 'Duplicate detector v2.0',
    confidence: 0.86,
    nights: 4,
    daysAgo: 4,
    summary: 'One controller repeats the same fault every few minutes until the first ticket closes.',
    conditions: [
      { field: 'ci', op: '=', value: 'aa23-door-ctl-02' },
      { field: 'dedupe.gap', op: '<', value: '' },
    ],
    threshold: { index: 1, unit: 'm', suggested: 10 },
    medianClear: '5 min',
    recurrence: 'Two bursts a night',
    title: 'Door controller chatter',
    cis: ['aa23-door-ctl-02'],
    decimals: 0,
    when: (r) => (r() < 0.5 ? normal(r, 90, 8) : normal(r, 340, 8)),
    batches: [
      { n: 18, resolution: 'duplicate', metric: [1, 8] },
      { n: 2, resolution: 'closed-no-action', metric: [12, 20] },
    ],
  },
  {
    id: 'SUG-09',
    name: 'Hyperdrive coolant probe spikes on cold start',
    groupId: 'hyperdrive',
    source: 'correlation-engine',
    sourceDetail: 'Correlation engine 2.9',
    confidence: 0.82,
    nights: 6,
    daysAgo: 6,
    summary: 'The probe reads high for a few seconds on a cold start, then settles.',
    conditions: [
      { field: 'ci', op: 'matches', value: 'hyperdrive-coolant-*' },
      { field: 'alert.duration', op: '<', value: '' },
    ],
    threshold: { index: 1, unit: 's', suggested: 20 },
    medianClear: '11 s',
    recurrence: 'Cold starts',
    title: 'Coolant probe spike',
    cis: ['hyperdrive-coolant-01', 'hyperdrive-coolant-02'],
    decimals: 0,
    when: (r) => normal(r, 300, 60),
    batches: [
      { n: 6, resolution: 'auto-cleared', metric: [4, 18] },
      { n: 1, resolution: 'worked', metric: [30, 50] },
    ],
  },
  {
    id: 'SUG-10',
    name: 'Armoury locker 11 badge reader timeouts',
    groupId: 'armory',
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.2',
    confidence: 0.77,
    nights: 3,
    daysAgo: 8,
    summary: 'The reader times out at the start of a shift and works on the second badge.',
    conditions: [
      { field: 'ci', op: '=', value: 'armoury-locker-11-reader' },
      { field: 'retry.count', op: '<', value: '' },
    ],
    threshold: { index: 1, unit: '', suggested: 3 },
    medianClear: '40 s',
    recurrence: 'Start of each shift',
    title: 'Badge reader timeout',
    cis: ['armoury-locker-11-reader'],
    decimals: 0,
    when: (r) => normal(r, 480 - 60, 15),
    batches: [{ n: 4, resolution: 'closed-no-action', metric: [1, 2] }],
  },
  {
    id: 'SUG-11',
    name: 'Deck 4 air scrubber filter warnings',
    groupId: 'lifesupport',
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.2',
    confidence: 0.58,
    nights: 2,
    daysAgo: 10,
    summary: 'The filter warning trips at shift change and clears when the fans settle.',
    conditions: [
      { field: 'ci', op: 'matches', value: 'deck-04-scrubber-*' },
      { field: 'alert.duration', op: '<', value: '' },
    ],
    threshold: { index: 1, unit: 'm', suggested: 15 },
    medianClear: '8 min',
    recurrence: 'Shift changes',
    title: 'Scrubber filter warning',
    cis: ['deck-04-scrubber-01', 'deck-04-scrubber-02'],
    decimals: 0,
    when: (r) => normal(r, 240, 20),
    batches: [
      { n: 3, resolution: 'closed-no-action', metric: [3, 12] },
      { n: 1, resolution: 'worked', metric: [5, 12] },
    ],
  },
];

function build(): Suggestion[] {
  const r = mulberry32(1138);
  const pools = SPECS.map((spec) =>
    spec.batches.flatMap((batch) =>
      Array.from({ length: batch.n }, (): NightIncident => {
        const [lo, hi] = batch.metric;
        const [short, long] = MINUTES_OPEN[batch.resolution];
        return {
          id: '',
          minute: Math.min(NIGHT_MINUTES - 2, Math.max(2, spec.when(r))),
          ci: spec.cis[Math.floor(r() * spec.cis.length)],
          title: spec.title,
          resolution: batch.resolution,
          minutesOpen: Math.round(short + r() * (long - short)),
          fails: batch.fails ?? [],
          metric: Number((lo + r() * (hi - lo)).toFixed(spec.decimals)),
        };
      }),
    ),
  );
  // Incident numbers run in the order the nights happened, across every pattern.
  pools
    .flatMap((pool, i) => pool.map((incident) => ({ incident, daysAgo: SPECS[i].daysAgo })))
    .sort((a, b) => b.daysAgo - a.daysAgo || a.incident.minute - b.incident.minute)
    .forEach(({ incident }, i) => {
      incident.id = `INC-${48102 + i}`;
    });
  return SPECS.map(({ title: _title, cis: _cis, decimals: _decimals, when: _when, batches: _batches, ...spec }, i) => ({
    ...spec,
    ruleId: `RUL-${String(441 + i).padStart(4, '0')}`,
    foundAt: refreshOf(spec.daysAgo),
    nightStart: nightOf(spec.daysAgo),
    pool: pools[i].sort((a, b) => a.minute - b.minute),
  }));
}

const ALL: Suggestion[] = build();

/** What's waiting in the overnight block, newest night first. */
export const SUGGESTIONS = ALL.filter((s) => s.daysAgo < REFRESH_WINDOW).sort((a, b) => a.daysAgo - b.daysAgo);

/** What has already moved to the rules, nobody having decided. */
export const MOVED_RULES: Rule[] = ALL.filter((s) => s.daysAgo >= REFRESH_WINDOW).map((s) => {
  const match = matchSuggestion(s, s.threshold.suggested);
  return movedFrom(s, asRule(s, match, s.threshold.suggested), match, refreshOf(s.daysAgo - REFRESH_WINDOW));
});
