/* The story all three directions tell: the same five chapters, the same numbers, so the only
 * thing that differs between them is the direction itself. */

export interface Chapter {
  id: 'alert' | 'pattern' | 'rule' | 'decision' | 'gate';
  label: string;
  title: string;
  body: string;
}

export const HEADLINE = { a: 'Silence the noise.', b: 'Never the signal.' };
export const SUB = 'Follow one alert from the second it fires to the rule that retires it.';

export const CHAPTERS: Chapter[] = [
  {
    id: 'alert',
    label: 'The alert',
    title: 'It starts with one alert.',
    body: '06:00, shift change. Coupling 7 on the tractor beam runs warm, pages Tractor Beam Ops, and clears itself 74 seconds later.',
  },
  {
    id: 'pattern',
    label: 'The pattern',
    title: 'It has happened 214 times.',
    body: 'Every shift change for 90 days, 98% of them gone before anyone looked. Each one still woke somebody up.',
  },
  {
    id: 'rule',
    label: 'The rule',
    title: 'The engine writes it down.',
    body: 'What all 214 have in common becomes three conditions. The conditions become a proposed rule, with its evidence attached.',
  },
  {
    id: 'decision',
    label: 'The decision',
    title: 'A person signs for it.',
    body: 'Approving takes a written reason, saved under your name. The engine replays 90 days first: 210 hidden, not one real incident missed.',
  },
  {
    id: 'gate',
    label: 'The gate',
    title: 'The noise stops. The signal doesn’t.',
    body: 'Matching alerts are suppressed and logged. Anything that doesn’t match, even the same coupling at 88 °C, still pages a person.',
  },
];

export const OUTRO = {
  title: 'Quiet, on purpose.',
  sub: 'Same morning, same alerts. Now the only ones left are the ones worth waking up for.',
  stats: [
    { value: 210, label: 'pages that never happened' },
    { value: 0, label: 'real incidents hidden' },
    { value: 32, suffix: 'h', label: 'handed back to the crew' },
  ],
};

export const TICKET = {
  id: 'INC-40231',
  title: 'Tractor beam coupling 7 temperature warning',
  ci: 'tb-coupling-07',
  group: 'Tractor Beam Ops',
  at: '06:00:12',
  clearedAt: '06:01:26',
  peak: '71.4 °C',
  seconds: 74,
};

/** Temperature over the alert's 74 seconds, °C. */
export const TEMPS = [66.2, 67.1, 68.4, 69.6, 70.8, 71.4, 71.1, 70.6, 69.9, 69.1, 68.3, 67.6, 67.0, 66.6, 66.4, 66.3];

/** Alerts like it per week, oldest first: 214 in all. */
export const WEEKLY = [17, 19, 16, 20, 18, 15, 19, 18, 17, 21, 16, 18];

export const CONDITIONS = [
  { label: 'Coupling', op: 'matches', specific: 'tb-coupling-07', general: 'tb-coupling-*' },
  { label: 'Temperature', op: 'under', specific: '71.4 °C', general: '72 °C' },
  { label: 'Cleared in', op: 'under', specific: '74 s', general: '90 s' },
];

export const RULE = {
  id: 'RUL-0412',
  name: 'Coupling heat, sub-threshold flaps',
  confidence: 93,
  reason: 'Reviewed 30 samples. All cleared during shift rebalancing.',
  who: 'Admiral Piett',
  when: '06:41',
  replay: [
    { value: 210, label: 'would have been hidden' },
    { value: 0, label: 'real incidents missed' },
    { value: 32, suffix: 'h', label: 'of paging saved' },
  ],
};

/** Alerts arriving after the rule is live. One is the same coupling, over the line. */
export const STREAM = [
  { ci: 'tb-coupling-04', detail: '70.9 °C', match: true },
  { ci: 'tb-coupling-07', detail: '71.2 °C', match: true },
  { ci: 'tb-coupling-02', detail: '70.4 °C', match: true },
  { ci: 'tb-coupling-07', detail: '88.4 °C', match: false },
  { ci: 'tb-coupling-05', detail: '71.6 °C', match: true },
  { ci: 'tb-coupling-01', detail: '70.2 °C', match: true },
  { ci: 'tb-coupling-07', detail: '70.7 °C', match: true },
];
