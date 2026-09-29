/* Everything the story says and shows. The copy lives here so the scenes stay about layout.
 * The data follows the dashboard's mock world (src/pages/rule-management/data/mockData.ts at the repo root):
 * RUL-0412 is the tractor beam coupling rule, RUL-0419 is the exhaust port. */

export const DASHBOARD_URL = 'http://localhost:5188';
export const USER = { name: 'Admiral Piett', initials: 'AP', role: 'Rule governor' };

/* ---------- chapters: the captions and the progress rail ---------- */

export interface Chapter {
  id: string;
  label: string;
  title: string;
  body: string;
  aside?: string;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'ticket',
    label: 'The ticket',
    title: 'It starts with a ticket.',
    body: 'Shift change, 06:00. Coupling 7 on the tractor beam runs warm, crosses the 70 °C line and pages Tractor Beam Ops. Seventy-four seconds later it clears itself. Nobody touched it.',
  },
  {
    id: 'recurrence',
    label: 'Recurrence',
    title: 'Then it happens again. And again.',
    body: '214 times in 90 days, always at shift change, and 98% gone before anyone looked. Every one of them still paged a person.',
  },
  {
    id: 'pattern',
    label: 'Pattern',
    title: 'The engine finds what they share.',
    body: 'The pattern miner lines up all 214 and keeps only what they have in common. The specifics become conditions. The conditions become a proposed rule.',
  },
  {
    id: 'rule',
    label: 'The rule',
    title: 'A proposal, with its evidence.',
    body: 'Confidence, purity and every matched incident sit beside the rule. Nothing is suppressed yet: the engine can propose, but it can’t decide.',
  },
  {
    id: 'decision',
    label: 'Decision',
    title: 'A person signs for it.',
    body: 'Approving takes a written reason, saved under your name. First the engine replays the last 90 days, so you can see exactly what the rule would have hidden.',
  },
  {
    id: 'suppression',
    label: 'Suppression',
    title: 'The noise stops at the gate.',
    body: 'Matching alerts are suppressed and logged, never deleted. Anything that doesn’t match, even from the same coupling, still pages a person.',
  },
  {
    id: 'guardrail',
    label: 'Guardrails',
    title: 'Not everything that repeats is noise.',
    body: 'This one is 41% confident, and one of its matches was a real attack run. Midnight won’t turn on a rule like that without a deliberate override. The right call here is to reject it.',
    aside: 'Someone should have told the Death Star.',
  },
  {
    id: 'audit',
    label: 'Audit',
    title: 'Every decision leaves a trail.',
    body: 'Who proposed it, who approved it and why, in their own words. Entries are only ever added, never edited.',
  },
];

/* ---------- the wall of noise (hero + outro) ---------- */

export interface WallRow {
  id: string;
  title: string;
  ci: string;
  time: string;
  /** Matches an active rule, so it goes quiet in the outro. */
  noise: boolean;
  target?: boolean;
}

const WALL_SOURCES: [string, string, boolean][] = [
  ['Turbolift 3 door obstruction, deck 12', 'turbolift-03-d12', true],
  ['Deck 12 CO2 warning during shift change', 'ls-deck12-co2', true],
  ['Hyperdrive fault code on impounded YT-1300', 'hd-bay327-yt1300', true],
  ['TIE ion engine pre-flight timeout', 'tie-hangar-04', true],
  ['Comlink key rotation retry', 'holonet-kr-02', true],
  ['Trash compactor 3263827 hydraulic pressure', 'compactor-3263827', false],
  ['Cell 2187 door sensor false-open', 'aa23-cell-2187', true],
  ['Reactor coolant flow jitter, 40–60% output', 'reactor-cool-2', true],
  ['MSE-6 mouse droid collision', 'mse6-deck-9', true],
  ['Probe droid heartbeat loss, Hoth system', 'probe-hoth-114', false],
  ['E-11 blaster inventory count mismatch', 'armory-e11-inv', true],
  ['Stormtrooper armour fitting duplicate', 'armory-fit-07', true],
  ['Superlaser pre-charge sequence warning', 'superlaser-pc-1', false],
  ['Tractor beam coupling 3 temperature warning', 'tb-coupling-03', true],
  ['Detention block AA-23 intruder alarm', 'aa23-sec-01', false],
  ['Hangar 327 bay door cycle fault', 'hangar-327-door', true],
];

export const WALL_COLS = 4;
export const WALL_ROWS = 19;
/** Which row in which column is the alert we follow. Chosen to sit near the middle of the stage. */
const TARGET = { col: 1, row: 9 };

export const WALL: WallRow[][] = Array.from({ length: WALL_COLS }, (_, c) =>
  Array.from({ length: WALL_ROWS }, (_, r) => {
    const n = c * WALL_ROWS + r;
    if (c === TARGET.col && r === TARGET.row) {
      return {
        id: 'INC-40231',
        title: 'Tractor beam coupling 7 temperature warning',
        ci: 'tb-coupling-07',
        time: '06:00',
        noise: true,
        target: true,
      };
    }
    const [title, ci, noise] = WALL_SOURCES[(n * 7 + c * 3) % WALL_SOURCES.length];
    const minutes = (n * 37) % 1440;
    return {
      id: `INC-${40100 + ((n * 53) % 900)}`,
      title,
      ci,
      time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
      noise,
    };
  }),
);

/* ---------- the rule we follow ---------- */

/** Matched incidents per week, oldest first. Adds up to 214. */
export const WEEKLY = [17, 19, 16, 20, 18, 15, 19, 18, 17, 21, 16, 18];
export const WEEKLY_TOTAL = WEEKLY.reduce((a, b) => a + b, 0);

/** The ticket's temperature over its 74 seconds, °C, one reading every ~5 s. */
export const TEMP_READINGS = [66.2, 67.1, 68.4, 69.6, 70.8, 71.4, 71.1, 70.6, 69.9, 69.1, 68.3, 67.6, 67.0, 66.6, 66.4, 66.3];

export interface Condition {
  field: string;
  op: string;
  /** What the ticket said… */
  specific: string;
  /** …and what the rule keeps. */
  general: string;
  /** Which ticket field it comes from. */
  from: 'ci' | 'metric' | 'duration';
}

export const CONDITIONS: Condition[] = [
  { field: 'ci', op: 'matches', specific: 'tb-coupling-07', general: 'tb-coupling-*', from: 'ci' },
  { field: 'metric.coupling_temp_c', op: '<', specific: '71.4', general: '72', from: 'metric' },
  { field: 'alert.duration', op: '<', specific: '74s', general: '90s', from: 'duration' },
];

export const RULE_0412 = {
  id: 'RUL-0412',
  name: 'Tractor beam coupling heat, sub-threshold flaps',
  group: 'Tractor Beam Ops',
  unit: 'Death Star',
  source: 'Pattern miner v4.2',
  confidence: 93,
  purity: 98,
  incidents: 214,
  escalated: 0,
  summary:
    'Coupling temperature crosses the 70 °C warning line at every shift change while reactor load rebalances. 98% of these alerts clear on their own within 90 seconds.',
  impact: { hidden: 210, escalated: 0, hours: 32 },
  reason: 'Reviewed 30 samples. All cleared during shift rebalancing; the generator crews confirm this is expected.',
};

/* ---------- the gate: alerts streaming past the active rule ---------- */

export interface StreamAlert {
  id: string;
  ci: string;
  detail: string;
  title: string;
  match: boolean;
  /** Worth pointing at: same CI, but over the threshold. */
  callout?: boolean;
}

export const STREAM: StreamAlert[] = [
  { id: 'INC-40232', ci: 'tb-coupling-04', detail: '70.9 °C · 61 s', title: 'Tractor beam coupling 4 temperature warning', match: true },
  { id: 'INC-40233', ci: 'tb-coupling-07', detail: '71.2 °C · 68 s', title: 'Tractor beam coupling 7 temperature warning', match: true },
  { id: 'INC-40234', ci: 'reactor-cool-2', detail: 'jitter 3.1%', title: 'Reactor coolant flow jitter at 52% output', match: false },
  { id: 'INC-40235', ci: 'tb-coupling-02', detail: '70.4 °C · 44 s', title: 'Tractor beam coupling 2 temperature warning', match: true },
  { id: 'INC-40236', ci: 'tb-coupling-07', detail: '71.0 °C · 80 s', title: 'Tractor beam coupling 7 temperature warning', match: true },
  { id: 'INC-40237', ci: 'tb-coupling-07', detail: '88.4 °C · 6 min', title: 'Coupling 7 overheating, still climbing', match: false, callout: true },
  { id: 'INC-40238', ci: 'tb-coupling-05', detail: '71.6 °C · 52 s', title: 'Tractor beam coupling 5 temperature warning', match: true },
  { id: 'INC-40239', ci: 'tb-coupling-01', detail: '70.2 °C · 39 s', title: 'Tractor beam coupling 1 temperature warning', match: true },
  { id: 'INC-40240', ci: 'hd-bay327', detail: 'fault 0x7F', title: 'Hyperdrive motivator fault, bay 327', match: false },
  { id: 'INC-40241', ci: 'tb-coupling-07', detail: '70.7 °C · 71 s', title: 'Tractor beam coupling 7 temperature warning', match: true },
];

/* ---------- the guardrail: RUL-0419 ---------- */

export const RULE_0419 = {
  id: 'RUL-0419',
  name: 'Thermal exhaust port proximity sensor, Sector 7G',
  group: 'Reactor Core',
  unit: 'Death Star',
  source: 'Correlation engine 2.9',
  confidence: 41,
  purity: 87,
  incidents: 38,
  escalated: 1,
  summary:
    'The proximity sensor on the two-metre exhaust port fires when maintenance droids pass the shaft. Most alerts close without action, but one matched incident was a real hostile approach.',
  realIncident: { id: 'INC-40219', title: 'Single-seat fighter in trench approaching exhaust port' },
  related: [
    { id: 'INC-40220', title: 'Exhaust port proximity trip, droid sweep', res: 'Duplicate', open: '5m', date: '22 Sept' },
    { id: 'INC-40219', title: 'Single-seat fighter in trench approaching exhaust port', res: 'Escalated', open: '12h 41m', date: '19 Sept', escalated: true },
    { id: 'INC-40221', title: 'Small object detected near thermal exhaust shaft', res: 'Worked, minor', open: '1h 51m', date: '17 Sept' },
    { id: 'INC-40222', title: 'Proximity sensor 7G intermittent', res: 'Auto-cleared', open: '11m', date: '12 Sept' },
  ],
  reason: 'One match was a single fighter in the trench. We are not suppressing this sensor.',
};

/* ---------- the audit log ---------- */

export interface AuditEntry {
  actor: string;
  initials: string;
  bot?: boolean;
  action: 'proposed' | 'approved' | 'rejected';
  rule: string;
  reason: string;
  time: string;
}

/** Newest first, the way the dashboard shows it. */
export const AUDIT: AuditEntry[] = [
  { actor: USER.name, initials: USER.initials, action: 'rejected', rule: 'RUL-0419', reason: RULE_0419.reason, time: '06:52' },
  {
    actor: 'Correlation engine 2.9',
    initials: 'CE',
    bot: true,
    action: 'proposed',
    rule: 'RUL-0419',
    reason: 'Correlated 38 low-severity proximity alerts with the droid maintenance schedule (r = 0.71).',
    time: '06:47',
  },
  { actor: USER.name, initials: USER.initials, action: 'approved', rule: 'RUL-0412', reason: RULE_0412.reason, time: '06:41' },
  {
    actor: 'Pattern miner v4.2',
    initials: 'PM',
    bot: true,
    action: 'proposed',
    rule: 'RUL-0412',
    reason: 'Cluster of 214 alerts with the same CI prefix and a sub-threshold metric; 98% auto-cleared.',
    time: '06:12',
  },
];

export const OUTRO_STATS = [
  { value: 210, label: 'pages that never happened' },
  { value: 0, label: 'real incidents hidden' },
  { value: 32, suffix: 'h', label: 'handed back to the crew' },
];
