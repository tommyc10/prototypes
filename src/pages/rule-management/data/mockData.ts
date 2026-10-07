/* Mock data: 20 rules, 9 assignment groups and 5 service groups, generated the same way every time.
 * This is the file the real backend replaces. Nothing else in the app knows the data is fake. */

import { NOW } from '../../../lib/clock';
import type {
  AssignmentGroup,
  AuditEntry,
  Condition,
  IncidentDetail,
  IncidentEvent,
  RelatedIncident,
  Resolution,
  Rule,
  ServiceGroup,
} from '../model/types';

export const CURRENT_USER = 'Admiral Piett';

export const GROUPS: AssignmentGroup[] = [
  { id: 'reactor', name: 'Reactor Core', unit: 'Death Star', serviceGroupId: 'power' },
  { id: 'tractor', name: 'Tractor Beam Ops', unit: 'Death Star', serviceGroupId: 'power' },
  { id: 'facilities', name: 'Facilities', unit: 'Death Star', serviceGroupId: 'station' },
  { id: 'detention', name: 'Detention Block AA-23', unit: 'Death Star', serviceGroupId: 'security' },
  { id: 'lifesupport', name: 'Life Support', unit: 'Executor', serviceGroupId: 'station' },
  { id: 'hyperdrive', name: 'Hyperdrive Maintenance', unit: 'Imperial Navy', serviceGroupId: 'power' },
  { id: 'hangar', name: 'TIE Hangar Ops', unit: 'Imperial Navy', serviceGroupId: 'flight' },
  { id: 'holonet', name: 'HoloNet Comms', unit: 'ISB', serviceGroupId: 'comms' },
  { id: 'armory', name: 'Armory & Logistics', unit: 'Stormtrooper Corps', serviceGroupId: 'security' },
];

/** Look up a group by its id. */
export const groupById = (id: string) => GROUPS.find((g) => g.id === id)!;

export const SERVICE_GROUPS: ServiceGroup[] = [
  { id: 'power', name: 'Power & Propulsion' },
  { id: 'station', name: 'Station Services' },
  { id: 'security', name: 'Security' },
  { id: 'flight', name: 'Flight Operations' },
  { id: 'comms', name: 'Communications' },
];

/** Look up a service group by its id. */
export const serviceGroupById = (id: string) => SERVICE_GROUPS.find((s) => s.id === id)!;

/* ---------- deterministic generation helpers ---------- */

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weekly(seed: string, total: number, shape: 'flat' | 'rising' | 'falling' | 'stopped' = 'flat') {
  const r = rng(seed + 'w');
  const base = total / 12;
  return Array.from({ length: 12 }, (_, i) => {
    let m = 1;
    if (shape === 'rising') m = 0.55 + i * 0.08;
    if (shape === 'falling') m = 1.5 - i * 0.09;
    if (shape === 'stopped') m = i < 8 ? 1.3 : 0.1;
    return Math.max(0, Math.round(base * m * (0.7 + r() * 0.6)));
  });
}

function daysAgo(d: number, h = 9) {
  const t = new Date(NOW);
  t.setUTCDate(t.getUTCDate() - d);
  t.setUTCHours(h, (d * 17) % 60, 0, 0);
  return t.toISOString();
}

let incSeq = 40210;
function related(
  seed: string,
  ci: string,
  titles: string[],
  purity: number,
  escalated: { title: string; ci?: string; daysAgo: number }[] = [],
): RelatedIncident[] {
  const r = rng(seed + 'r');
  const out: RelatedIncident[] = escalated.map((e) => ({
    id: `INC-${incSeq++}`,
    title: e.title,
    ci: e.ci ?? ci,
    openedAt: daysAgo(e.daysAgo, 3),
    resolution: 'escalated' as Resolution,
    minutesOpen: 180 + Math.round(r() * 600),
  }));
  const noise: Resolution[] = ['auto-cleared', 'auto-cleared', 'closed-no-action', 'duplicate'];
  for (let i = 0; i < 9 - escalated.length; i++) {
    const worked = r() > purity + 0.04;
    out.push({
      id: `INC-${incSeq++}`,
      title: titles[i % titles.length],
      ci,
      openedAt: daysAgo(Math.round(1 + i * 7 + r() * 5), Math.round(r() * 23)),
      resolution: worked ? 'worked' : noise[Math.floor(r() * noise.length)],
      minutesOpen: worked ? 40 + Math.round(r() * 90) : 1 + Math.round(r() * 14),
    });
  }
  return out.sort((a, b) => b.openedAt.localeCompare(a.openedAt));
}

const sys = (detail: string, d: number, text: string): AuditEntry => ({
  at: daysAgo(d, 6),
  actor: detail,
  action: 'proposed',
  reason: text,
});

/* ---------- rules ---------- */

export const RULES: Rule[] = [
  {
    id: 'RUL-0412',
    name: 'Tractor beam coupling heat, sub-threshold flaps',
    status: 'active',
    groupId: 'tractor',
    confidence: 0.93,
    purity: 0.98,
    incidentCount: 214,
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.2',
    createdAt: daysAgo(96),
    updatedAt: daysAgo(61),
    evidence: {
      summary:
        'Coupling temperature crosses the 70°C warning line at every shift change while reactor load rebalances. 98% of these alerts clear on their own within 90 seconds.',
      conditions: [
        { field: 'ci', op: 'matches', value: 'tb-coupling-*' },
        { field: 'metric.coupling_temp_c', op: '<', value: '72' },
        { field: 'alert.duration', op: '<', value: '90s' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0412', 214),
      medianClear: '74 s',
      recurrence: 'Every ~8 h, at shift change',
      escalations: 0,
    },
    related: related('0412', 'tb-coupling-07', [
      'Tractor beam coupling 7 temperature warning',
      'Coupling terminal heat above 70°C, generator 3',
      'Tractor beam power coupling thermal flap',
    ], 0.98),
    audit: [
      sys('Pattern miner v4.2', 96, 'Cluster of 61 alerts with identical CI prefix and sub-threshold metric; 100% auto-cleared.'),
      { at: daysAgo(61), actor: 'Grand Moff Tarkin', action: 'approved', reason: 'Reviewed 30 samples. All cleared during shift rebalancing; the generator crews confirm this is expected behaviour.' },
    ],
  },
  {
    id: 'RUL-0419',
    name: 'Thermal exhaust port proximity sensor, Sector 7G',
    status: 'proposed',
    groupId: 'reactor',
    confidence: 0.41,
    purity: 0.87,
    incidentCount: 38,
    source: 'correlation-engine',
    sourceDetail: 'Correlation engine 2.9',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    evidence: {
      summary:
        'Proximity sensor on the two-metre exhaust port fires when maintenance droids pass the shaft. Most alerts close without action, but one matched incident was a real hostile approach.',
      conditions: [
        { field: 'ci', op: '=', value: 'exhaust-port-7g-prox' },
        { field: 'alert.object_size_m', op: '<', value: '3.0' },
        { field: 'priority', op: '>=', value: 'P3' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0419', 38, 'rising'),
      medianClear: '6 min',
      recurrence: 'Irregular, clusters during droid sweeps',
      escalations: 1,
    },
    related: related('0419', 'exhaust-port-7g-prox', [
      'Exhaust port proximity trip, droid sweep',
      'Small object detected near thermal exhaust shaft',
      'Proximity sensor 7G intermittent',
    ], 0.87, [{ title: 'Single-seat fighter in trench approaching exhaust port', daysAgo: 9 }]),
    audit: [sys('Correlation engine 2.9', 4, 'Correlated 38 low-severity proximity alerts with droid maintenance schedule (r = 0.71).')],
  },
  {
    id: 'RUL-0388',
    name: 'Turbolift 3 door obstruction duplicates',
    status: 'active',
    groupId: 'facilities',
    confidence: 0.88,
    purity: 0.95,
    incidentCount: 167,
    source: 'duplicate-detector',
    sourceDetail: 'Duplicate detector 1.6',
    createdAt: daysAgo(140),
    updatedAt: daysAgo(118),
    evidence: {
      summary:
        'Each obstruction raises one alert per deck sensor. The detector keeps the first and suppresses the other 3 to 11 copies raised within 5 minutes.',
      conditions: [
        { field: 'ci', op: 'matches', value: 'turbolift-03-*' },
        { field: 'short_description', op: 'contains', value: 'door obstruction' },
        { field: 'dedupe.window', op: '=', value: '5m' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0388', 167),
      medianClear: '3 min',
      recurrence: 'Bursts of 4–12 alerts',
      escalations: 0,
    },
    related: related('0388', 'turbolift-03-deck-12', [
      'Turbolift 3 door obstruction, deck 12',
      'Turbolift 3 door sensor blocked',
      'Turbolift 3 door obstruction, deck 14',
    ], 0.95),
    audit: [
      sys('Duplicate detector 1.6', 140, 'Detected identical alert payloads from 12 deck sensors within 5 minute windows.'),
      { at: daysAgo(118), actor: 'Moff Jerjerrod', action: 'approved', reason: 'Duplicates only. The first alert still reaches Facilities, which is what we need.' },
    ],
  },
  {
    id: 'RUL-0430',
    name: 'Trash compactor 3263827 hydraulic pressure warnings',
    status: 'proposed',
    groupId: 'facilities',
    confidence: 0.72,
    purity: 0.91,
    incidentCount: 52,
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.2',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
    evidence: {
      summary:
        'Hydraulic pressure warnings fire on every compaction cycle. Most close without action, but the compactor was once engaged with occupants inside.',
      conditions: [
        { field: 'ci', op: '=', value: 'compactor-3263827' },
        { field: 'metric.hydraulic_bar', op: 'between', value: '180–220' },
        { field: 'alert.type', op: '=', value: 'pressure_warning' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0430', 52),
      medianClear: '4 min',
      recurrence: 'Each compaction cycle',
      escalations: 1,
    },
    related: related('0430', 'compactor-3263827', [
      'Compactor 3263827 hydraulic pressure warning',
      'Detention level compactor cycle pressure high',
      'Compactor wall hydraulic variance',
    ], 0.91, [{ title: 'Compactor walls engaged with life forms detected inside', daysAgo: 22 }]),
    audit: [sys('Pattern miner v4.2', 6, 'Periodic pressure warnings aligned to compaction schedule (period 2 h 10 m).')],
  },
  {
    id: 'RUL-0401',
    name: 'Hyperdrive motivator calibration drift under 0.3%',
    status: 'active',
    groupId: 'hyperdrive',
    confidence: 0.9,
    purity: 0.97,
    incidentCount: 131,
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.1',
    createdAt: daysAgo(180),
    updatedAt: daysAgo(150),
    evidence: {
      summary:
        'Motivators drift slightly after every jump and recalibrate automatically at the next sublight cycle. Drift under 0.3% has never needed a technician.',
      conditions: [
        { field: 'ci.class', op: '=', value: 'hyperdrive-motivator' },
        { field: 'metric.calibration_drift_pct', op: '<', value: '0.3' },
        { field: 'fleet', op: 'in', value: 'Death Squadron' },
      ],
      window: 'Rolling 180 days',
      weekly: weekly('0401', 131),
      medianClear: '11 min',
      recurrence: 'After each hyperspace jump',
      escalations: 0,
    },
    related: related('0401', 'motivator-isd-avenger', [
      'Hyperdrive motivator calibration drift, Avenger',
      'Motivator drift 0.2%, Stalker',
      'Post-jump calibration variance, Devastator',
    ], 0.97),
    audit: [
      sys('Pattern miner v4.1', 180, 'Drift alerts below 0.3% auto-recalibrated in 131 of 131 cases.'),
      { at: daysAgo(150), actor: 'Admiral Ozzel', action: 'approved', reason: 'Engineering confirms self-recalibration. Threshold kept conservative at 0.3%.' },
    ],
  },
  {
    id: 'RUL-0433',
    name: 'Hyperdrive fault codes on impounded YT-1300 freighter',
    status: 'proposed',
    groupId: 'hyperdrive',
    confidence: 0.38,
    purity: 0.8,
    incidentCount: 15,
    source: 'operator',
    sourceDetail: 'Suggested by Lt. Tanbris',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    evidence: {
      summary:
        'An impounded Corellian freighter in Docking Bay 327 raises hyperdrive fault codes constantly. The operator wants them muted, but the ship left the bay once without clearance.',
      conditions: [
        { field: 'ci', op: '=', value: 'impound-db327-yt1300' },
        { field: 'alert.code', op: 'in', value: 'HD-17, HD-22, HD-40' },
      ],
      window: 'Rolling 30 days',
      weekly: weekly('0433', 15, 'rising'),
      medianClear: '22 min',
      recurrence: 'Irregular',
      escalations: 1,
    },
    related: related('0433', 'impound-db327-yt1300', [
      'YT-1300 hyperdrive fault HD-22',
      'Impounded freighter motivator fault',
      'Docking Bay 327 hyperdrive code HD-17',
    ], 0.8, [{ title: 'Impounded freighter departed Docking Bay 327 without clearance', daysAgo: 12 }]),
    audit: [sys('Lt. Tanbris', 2, 'This freighter is a heap. It throws a fault every few hours and we are not going to fix it.')],
  },
  {
    id: 'RUL-0376',
    name: 'TIE ion engine pre-flight timeout during cold start',
    status: 'active',
    groupId: 'hangar',
    confidence: 0.85,
    purity: 0.94,
    incidentCount: 289,
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.0',
    createdAt: daysAgo(210),
    updatedAt: daysAgo(34),
    evidence: {
      summary:
        'Twin ion engines on cold hangar decks exceed the 40 s pre-flight check. The check passes on retry in nearly all cases.',
      conditions: [
        { field: 'ci.class', op: '=', value: 'tie-ln-ion-engine' },
        { field: 'check', op: '=', value: 'preflight' },
        { field: 'hangar.temp_c', op: '<', value: '-10' },
        { field: 'retry.result', op: '=', value: 'pass' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0376', 289, 'falling'),
      medianClear: '52 s',
      recurrence: 'Morning launch windows',
      escalations: 0,
    },
    related: related('0376', 'tie-ln-hangar-4', [
      'TIE/ln pre-flight check timeout, Hangar 4',
      'Ion engine warm-up exceeded 40 s',
      'Pre-flight timeout, Black Squadron',
    ], 0.94),
    audit: [
      sys('Pattern miner v4.0', 210, 'Pre-flight timeouts cluster below −10°C and pass on retry.'),
      { at: daysAgo(190), actor: 'General Veers', action: 'approved', reason: 'Retry pass is the ground truth. Launch crews still see the retry result.' },
      { at: daysAgo(40), actor: 'Captain Needa', action: 'deactivated', reason: 'Checking whether the new engine firmware removes the timeouts entirely.' },
      { at: daysAgo(34), actor: 'Captain Needa', action: 'activated', reason: 'Firmware did not change timeout behaviour. Reactivating.' },
    ],
  },
  {
    id: 'RUL-0395',
    name: 'TIE Advanced x1 telemetry gaps in hyperspace',
    status: 'inactive',
    groupId: 'hangar',
    confidence: 0.64,
    purity: 0.83,
    incidentCount: 44,
    source: 'correlation-engine',
    sourceDetail: 'Correlation engine 2.7',
    createdAt: daysAgo(120),
    updatedAt: daysAgo(58),
    evidence: {
      summary:
        'Telemetry drops while the prototype fighter is in hyperspace. The rule was active until it masked a real telemetry loss during the Yavin engagement.',
      conditions: [
        { field: 'ci', op: '=', value: 'tie-adv-x1-001' },
        { field: 'alert.type', op: '=', value: 'telemetry_gap' },
        { field: 'nav.state', op: '=', value: 'hyperspace' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0395', 44, 'stopped'),
      medianClear: '9 min',
      recurrence: 'During jumps',
      escalations: 1,
    },
    related: related('0395', 'tie-adv-x1-001', [
      'TIE Advanced telemetry gap',
      'x1 prototype telemetry lost in transit',
      'Telemetry heartbeat missed, x1',
    ], 0.83, [{ title: 'TIE Advanced x1 spinning away from battle station, no telemetry', daysAgo: 58 }]),
    audit: [
      sys('Correlation engine 2.7', 120, 'Telemetry gaps correlate with hyperspace state (r = 0.88).'),
      { at: daysAgo(101), actor: 'Director Krennic', action: 'approved', reason: 'Gaps line up with jumps. Suppressing to reduce noise for the flight deck.' },
      { at: daysAgo(58), actor: 'Admiral Piett', action: 'deactivated', reason: 'Masked a real telemetry loss during the Yavin engagement. Not safe while the pilot flies solo.' },
    ],
  },
  {
    id: 'RUL-0421',
    name: 'Cell 2187 door sensor false-open',
    status: 'proposed',
    groupId: 'detention',
    confidence: 0.58,
    purity: 0.89,
    incidentCount: 27,
    source: 'duplicate-detector',
    sourceDetail: 'Duplicate detector 1.6',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    evidence: {
      summary:
        'The door sensor on cell 2187 reports open during guard rotations. The detector groups them as duplicates, but one alert came from an unauthorised prisoner transfer.',
      conditions: [
        { field: 'ci', op: '=', value: 'aa23-cell-2187-door' },
        { field: 'alert.state', op: '=', value: 'open' },
        { field: 'guard.rotation', op: '=', value: 'true' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0421', 27),
      medianClear: '2 min',
      recurrence: 'Guard rotations',
      escalations: 1,
    },
    related: related('0421', 'aa23-cell-2187-door', [
      'Cell 2187 door reports open',
      'Detention AA-23 door sensor state mismatch',
      'Cell door telemetry flap, 2187',
    ], 0.89, [{ title: 'Prisoner transfer from Cell Block 1138, not on manifest', daysAgo: 15 }]),
    audit: [sys('Duplicate detector 1.6', 3, 'Door-open alerts repeating within guard rotation windows.')],
  },
  {
    id: 'RUL-0360',
    name: 'Detention block CO2 scrubber cycling',
    status: 'active',
    groupId: 'detention',
    confidence: 0.91,
    purity: 0.99,
    incidentCount: 402,
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.0',
    createdAt: daysAgo(260),
    updatedAt: daysAgo(240),
    evidence: {
      summary: 'Scrubbers cycle every 20 minutes and log a transient CO2 bump. Levels always stay far below the safety threshold.',
      conditions: [
        { field: 'ci.class', op: '=', value: 'co2-scrubber' },
        { field: 'location', op: 'matches', value: 'AA-23/*' },
        { field: 'metric.co2_ppm', op: '<', value: '1800' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0360', 402),
      medianClear: '40 s',
      recurrence: 'Every 20 min',
      escalations: 0,
    },
    related: related('0360', 'aa23-scrubber-2', [
      'CO2 scrubber cycle spike, AA-23',
      'Scrubber 2 transient ppm rise',
      'Detention scrubber cycle alert',
    ], 0.99),
    audit: [
      sys('Pattern miner v4.0', 260, 'Periodic CO2 alert every 20 min, peak 1,410 ppm.'),
      { at: daysAgo(240), actor: 'Grand Moff Tarkin', action: 'approved', reason: 'Well under the 5,000 ppm limit. Pure noise for the detention team.' },
    ],
  },
  {
    id: 'RUL-0409',
    name: 'HoloNet relay packet loss, Outer Rim, under 2 min',
    status: 'active',
    groupId: 'holonet',
    confidence: 0.87,
    purity: 0.96,
    incidentCount: 356,
    source: 'correlation-engine',
    sourceDetail: 'Correlation engine 2.9',
    createdAt: daysAgo(88),
    updatedAt: daysAgo(80),
    evidence: {
      summary: 'Outer Rim relays lose packets briefly during ion storms. Losses under 2 minutes recover without intervention.',
      conditions: [
        { field: 'ci.region', op: '=', value: 'Outer Rim' },
        { field: 'metric.packet_loss_pct', op: '>', value: '5' },
        { field: 'alert.duration', op: '<', value: '2m' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0409', 356),
      medianClear: '68 s',
      recurrence: 'Ion storm season',
      escalations: 0,
    },
    related: related('0409', 'holonet-relay-ord-mantell', [
      'HoloNet relay packet loss, Ord Mantell',
      'Relay 44-B brief packet loss',
      'Outer Rim relay degraded, under 2 min',
    ], 0.96),
    audit: [
      sys('Correlation engine 2.9', 88, 'Packet loss events correlate with ion storm telemetry (r = 0.83).'),
      { at: daysAgo(80), actor: 'Director Krennic', action: 'approved', reason: 'Short outages only. Anything past 2 minutes still pages ISB.' },
    ],
  },
  {
    id: 'RUL-0426',
    name: 'Comlink encryption key rotation retries',
    status: 'proposed',
    groupId: 'holonet',
    confidence: 0.79,
    purity: 0.97,
    incidentCount: 88,
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.2',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    evidence: {
      summary: 'Key rotation retries once on 3% of comlinks and succeeds on the second attempt. Only the first attempt raises an alert.',
      conditions: [
        { field: 'job', op: '=', value: 'comlink-key-rotation' },
        { field: 'attempt', op: '=', value: '1' },
        { field: 'next_attempt.result', op: '=', value: 'success' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0426', 88),
      medianClear: '3 min',
      recurrence: 'Nightly rotation job',
      escalations: 0,
    },
    related: related('0426', 'isb-keyrotation', [
      'Comlink key rotation failed, attempt 1',
      'Encryption rotation retry, sector 9',
      'Key rotation job partial failure',
    ], 0.97),
    audit: [sys('Pattern miner v4.2', 5, 'First-attempt failures followed by success within 3 minutes in 85 of 88 cases.')],
  },
  {
    id: 'RUL-0380',
    name: 'Probe droid heartbeat loss, Hoth system',
    status: 'inactive',
    groupId: 'holonet',
    confidence: 0.52,
    purity: 0.71,
    incidentCount: 19,
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.1',
    createdAt: daysAgo(74),
    updatedAt: daysAgo(70),
    evidence: {
      summary: 'Probe droids in the Hoth system drop their heartbeat in extreme cold. One heartbeat loss came from a droid that found the rebel base and self-destructed.',
      conditions: [
        { field: 'ci.class', op: '=', value: 'viper-probe-droid' },
        { field: 'location.system', op: '=', value: 'Hoth' },
        { field: 'alert.type', op: '=', value: 'heartbeat_lost' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0380', 19, 'stopped'),
      medianClear: '31 min',
      recurrence: 'Night cycles',
      escalations: 1,
    },
    related: related('0380', 'viper-probe-hoth', [
      'Probe droid heartbeat lost, Hoth',
      'Viper droid signal loss, northern ice field',
      'Probe heartbeat timeout',
    ], 0.71, [{ title: 'Probe droid self-destructed after transmitting base coordinates', daysAgo: 71 }]),
    audit: [
      sys('Pattern miner v4.1', 74, 'Heartbeat losses in sub-zero night cycles, 13 of 19 recovered.'),
      { at: daysAgo(70), actor: 'Captain Needa', action: 'rejected', reason: 'Signal loss preceded confirmation of the rebel base on Hoth. This is not noise.' },
    ],
  },
  {
    id: 'RUL-0415',
    name: 'E-11 blaster inventory count mismatch after drills',
    status: 'active',
    groupId: 'armory',
    confidence: 0.82,
    purity: 0.92,
    incidentCount: 73,
    source: 'operator',
    sourceDetail: 'Suggested by Sgt. Kreel',
    createdAt: daysAgo(66),
    updatedAt: daysAgo(60),
    evidence: {
      summary: 'Inventory scans run during drills count rifles still in the field. The count reconciles once the drill ends.',
      conditions: [
        { field: 'ci.class', op: '=', value: 'armory-inventory' },
        { field: 'item', op: '=', value: 'E-11' },
        { field: 'drill.active', op: '=', value: 'true' },
        { field: 'variance', op: '<=', value: '12' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0415', 73),
      medianClear: '1 h 40 m',
      recurrence: 'Drill schedule',
      escalations: 0,
    },
    related: related('0415', 'armory-deck-5', [
      'E-11 count mismatch, armory deck 5',
      'Blaster inventory variance during drill',
      'Rifle count off by 8, deck 5',
    ], 0.92),
    audit: [
      sys('Sgt. Kreel', 66, 'We raise this every drill and it always reconciles.'),
      { at: daysAgo(60), actor: 'General Veers', action: 'approved', reason: 'Variance cap of 12 keeps real losses visible. Approved for drill windows only.' },
    ],
  },
  {
    id: 'RUL-0428',
    name: 'Stormtrooper armour fitting ticket duplicates',
    status: 'proposed',
    groupId: 'armory',
    confidence: 0.95,
    purity: 0.99,
    incidentCount: 121,
    source: 'duplicate-detector',
    sourceDetail: 'Duplicate detector 1.6',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    evidence: {
      summary: 'The fitting kiosk files a new ticket every time a trooper retries the scan. All copies after the first are identical.',
      conditions: [
        { field: 'ci', op: '=', value: 'armour-fitting-kiosk' },
        { field: 'caller', op: '=', value: 'same as open ticket' },
        { field: 'dedupe.window', op: '=', value: '30m' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0428', 121, 'rising'),
      medianClear: '0 s (duplicate)',
      recurrence: 'Recruitment intake',
      escalations: 0,
    },
    related: related('0428', 'armour-fitting-kiosk', [
      'Armour fitting request, TK-421',
      'Armour fitting request, TK-421 (retry)',
      'Helmet sizing ticket, FN-2187',
    ], 0.99),
    audit: [sys('Duplicate detector 1.6', 1, 'Identical caller and payload within 30 minutes in 120 of 121 cases.')],
  },
  {
    id: 'RUL-0366',
    name: 'Reactor coolant flow jitter at 40–60% output',
    status: 'active',
    groupId: 'reactor',
    confidence: 0.89,
    purity: 0.93,
    incidentCount: 198,
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.0',
    createdAt: daysAgo(230),
    updatedAt: daysAgo(12),
    evidence: {
      summary: 'Coolant flow jitters in the mid-output band as pumps hand over. Flow never leaves the safe envelope.',
      conditions: [
        { field: 'ci.class', op: '=', value: 'reactor-coolant-pump' },
        { field: 'reactor.output_pct', op: 'between', value: '40–60' },
        { field: 'metric.flow_variance', op: '<', value: '4%' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0366', 198),
      medianClear: '2 min',
      recurrence: 'Output transitions',
      escalations: 0,
    },
    related: related('0366', 'coolant-pump-bank-a', [
      'Coolant flow variance, pump bank A',
      'Reactor coolant jitter at 52% output',
      'Pump handover flow alert',
    ], 0.93),
    audit: [
      sys('Pattern miner v4.0', 230, 'Flow variance alerts concentrated between 40 and 60% output.'),
      { at: daysAgo(210), actor: 'Grand Moff Tarkin', action: 'approved', reason: 'Reactor engineering signed off. Variance cap keeps real flow loss visible.' },
      { at: daysAgo(14), actor: 'Moff Jerjerrod', action: 'deactivated', reason: 'Pausing during the superlaser firing test so engineering sees everything.' },
      { at: daysAgo(12), actor: 'Moff Jerjerrod', action: 'activated', reason: 'Test complete, no anomalies. Restoring suppression.' },
    ],
  },
  {
    id: 'RUL-0435',
    name: 'Superlaser pre-charge sequence warnings',
    status: 'proposed',
    groupId: 'reactor',
    confidence: 0.47,
    purity: 0.76,
    incidentCount: 11,
    source: 'correlation-engine',
    sourceDetail: 'Correlation engine 2.9',
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
    evidence: {
      summary: 'Pre-charge warnings appear on every firing sequence. The sample is small and a quarter of the incidents were worked by engineers.',
      conditions: [
        { field: 'ci', op: 'matches', value: 'superlaser-tributary-*' },
        { field: 'sequence', op: '=', value: 'pre-charge' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0435', 11, 'rising'),
      medianClear: '14 min',
      recurrence: 'Firing sequences',
      escalations: 0,
    },
    related: related('0435', 'superlaser-tributary-4', [
      'Tributary beam 4 pre-charge warning',
      'Superlaser focus lens pre-charge variance',
      'Pre-charge sequence alert, primary',
    ], 0.76),
    audit: [sys('Correlation engine 2.9', 0, 'Warnings co-occur with every firing sequence start (11 of 11).')],
  },
  {
    id: 'RUL-0371',
    name: 'Executor bridge viewport condensation alarms',
    status: 'inactive',
    groupId: 'lifesupport',
    confidence: 0.77,
    purity: 0.95,
    incidentCount: 64,
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.1',
    createdAt: daysAgo(160),
    updatedAt: daysAgo(90),
    evidence: {
      summary: 'Condensation formed on the bridge viewport while the Executor held orbit over Hoth. The pattern stopped when the fleet left the system.',
      conditions: [
        { field: 'ci', op: '=', value: 'executor-bridge-viewport' },
        { field: 'alert.type', op: '=', value: 'condensation' },
      ],
      window: 'Rolling 180 days',
      weekly: weekly('0371', 64, 'stopped'),
      medianClear: '18 min',
      recurrence: 'Planetary orbit, cold worlds',
      escalations: 0,
    },
    related: related('0371', 'executor-bridge-viewport', [
      'Bridge viewport condensation alarm',
      'Viewport humidity sensor, bridge',
      'Condensation on forward viewport',
    ], 0.95),
    audit: [
      sys('Pattern miner v4.1', 160, 'Condensation alarms during Hoth orbit, all cleared by environmental systems.'),
      { at: daysAgo(150), actor: 'Admiral Ozzel', action: 'approved', reason: 'Environmental systems clear these automatically.' },
      { at: daysAgo(90), actor: 'Admiral Piett', action: 'deactivated', reason: 'Executor left Hoth orbit. The pattern no longer occurs and the rule should not linger.' },
    ],
  },
  {
    id: 'RUL-0424',
    name: 'Deck 12 CO2 warnings during shift change',
    status: 'proposed',
    groupId: 'lifesupport',
    confidence: 0.84,
    purity: 0.96,
    incidentCount: 97,
    source: 'pattern-miner',
    sourceDetail: 'Pattern miner v4.2',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    evidence: {
      summary: 'Crew density on deck 12 doubles for 15 minutes at shift change and CO2 briefly crosses the warning line.',
      conditions: [
        { field: 'ci', op: '=', value: 'executor-deck12-air' },
        { field: 'metric.co2_ppm', op: '<', value: '2000' },
        { field: 'crew.shift_change', op: '=', value: 'true' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0424', 97),
      medianClear: '12 min',
      recurrence: 'Every 8 h, at shift change',
      escalations: 0,
    },
    related: related('0424', 'executor-deck12-air', [
      'Deck 12 CO2 warning, shift change',
      'Air quality alert, Executor deck 12',
      'CO2 above 1,500 ppm, deck 12',
    ], 0.96),
    audit: [sys('Pattern miner v4.2', 3, 'CO2 warnings aligned to shift change in 93 of 97 cases.')],
  },
  {
    id: 'RUL-0392',
    name: 'MSE-6 mouse droid collision alerts',
    status: 'inactive',
    groupId: 'facilities',
    confidence: 0.69,
    purity: 0.9,
    incidentCount: 58,
    source: 'operator',
    sourceDetail: 'Suggested by TK-421',
    createdAt: daysAgo(130),
    updatedAt: daysAgo(44),
    evidence: {
      summary: 'Mouse droids collided with boots in corridors and raised alerts. Pathing firmware v2.1 fixed the root cause.',
      conditions: [
        { field: 'ci.class', op: '=', value: 'mse-6' },
        { field: 'alert.type', op: '=', value: 'collision' },
      ],
      window: 'Rolling 90 days',
      weekly: weekly('0392', 58, 'stopped'),
      medianClear: '1 min',
      recurrence: 'Busy corridors',
      escalations: 0,
    },
    related: related('0392', 'mse-6-corridor', [
      'MSE-6 collision alert, corridor 9',
      'Mouse droid bumped, level 5',
      'Droid collision report',
    ], 0.9),
    audit: [
      sys('TK-421', 130, 'These droids hit everyone. Please mute.'),
      { at: daysAgo(122), actor: 'Moff Jerjerrod', action: 'approved', reason: 'Harmless collisions. Suppress until firmware lands.' },
      { at: daysAgo(44), actor: 'Moff Jerjerrod', action: 'deactivated', reason: 'Pathing firmware v2.1 fixed the root cause. Rule no longer matches anything.' },
    ],
  },
];

/* ---------- every incident a rule matched ----------
 * `related` is a small sample. This expands it to the rule's full incidentCount,
 * in the sample's style. The real app fetches this from the server, page by page. */

export function allIncidents(rule: Rule): RelatedIncident[] {
  const r = rng(rule.id + 'all');
  const like = rule.related.filter((i) => i.resolution !== 'escalated');
  const noise: Resolution[] = ['auto-cleared', 'auto-cleared', 'closed-no-action', 'duplicate'];
  const rest = Array.from({ length: rule.incidentCount - rule.related.length }, (_, i): RelatedIncident => {
    const worked = r() > rule.purity;
    return {
      id: `INC-${50000 + Number(rule.id.slice(4)) * 100 + i}`,
      title: like[i % like.length].title,
      ci: like[i % like.length].ci,
      openedAt: daysAgo(Math.floor(r() * 90), Math.floor(r() * 24)),
      resolution: worked ? 'worked' : noise[Math.floor(r() * noise.length)],
      minutesOpen: worked ? 40 + Math.round(r() * 90) : 1 + Math.round(r() * 14),
    };
  });
  return [...rule.related, ...rest].sort((a, b) => b.openedAt.localeCompare(a.openedAt));
}

/* ---------- one incident, opened ----------
 * The timeline, the close note and the values the rule matched on, made up from the
 * incident's row. The real app fetches this from the server when an incident is opened. */

const OPERATORS = ['TK-421', 'TK-710', 'Lieutenant Tanbris', 'Chief Bast'];

/** A value this incident could have had for the rule's condition to match it. */
function actualValue(condition: Condition, incident: RelatedIncident, openedAt: number, r: () => number) {
  const { field, op, value } = condition;
  if (field === 'ci') return incident.ci;
  if (field === 'priority') return `P${openedAt}`;
  if (op === 'in') {
    const options = value.split(', ');
    return options[Math.floor(r() * options.length)];
  }
  if (op === 'matches') return value.replace('*', String(1 + Math.floor(r() * 12)).padStart(2, '0'));
  if (op === 'between') {
    const [low, high] = value.split('–').map(Number);
    return String(Math.round(low + r() * (high - low)));
  }
  // "< 72", "< 90s", "> 5": a number on the right side of the limit, keeping its unit.
  const [, digits, unit] = value.match(/^(-?\d+(?:\.\d+)?)(.*)$/) ?? [];
  if (digits && /^[<>]/.test(op)) {
    const limit = Number(digits);
    const gap = Math.max(Math.abs(limit) * (0.05 + r() * 0.3), 0.1);
    const n = op.startsWith('<') ? limit - gap : limit + gap;
    const decimals = digits.split('.')[1]?.length ?? 0;
    return (decimals ? n.toFixed(decimals) : String(op.startsWith('<') ? Math.floor(n) : Math.ceil(n))) + unit;
  }
  return value;
}

export function incidentDetail(rule: Rule, incident: RelatedIncident): IncidentDetail {
  const r = rng(incident.id + 'detail');
  const group = groupById(rule.groupId);
  const operator = OPERATORS[Math.floor(r() * OPERATORS.length)];
  const end = incident.minutesOpen;
  const openedAt = incident.resolution === 'escalated' || incident.resolution === 'worked' || r() > 0.6 ? 3 : 4;
  const at = (minutes: number) => new Date(new Date(incident.openedAt).getTime() + minutes * 60_000).toISOString();
  const step = (minutes: number, actor: string, text: string): IncidentEvent => ({ at: at(minutes), actor, text });

  const matched = rule.evidence.conditions.map((c) => ({ ...c, actual: actualValue(c, incident, openedAt, r) }));

  const opening = [
    step(-(1 + Math.floor(r() * 3)), 'Monitoring', `Alert raised on ${incident.ci}`),
    step(0, 'Event bridge', `Incident opened at P${openedAt} for ${group.name}`),
  ];

  switch (incident.resolution) {
    case 'auto-cleared':
      return {
        priority: openedAt,
        alertCount: 1 + Math.floor(r() * 3),
        handledBy: 'Nobody, closed automatically',
        closeNote: 'The alert cleared before anyone picked it up. No action was taken.',
        matched,
        events: [...opening, step(end, 'Monitoring', 'Alert cleared on its own. Incident closed automatically.')],
      };
    case 'closed-no-action':
      return {
        priority: openedAt,
        alertCount: 1 + Math.floor(r() * 3),
        handledBy: operator,
        closeNote: 'Checked the reading against the baseline. Within the normal range, so closed without action.',
        matched,
        events: [
          ...opening,
          step(Math.max(1, Math.round(end * 0.4)), operator, 'Acknowledged'),
          step(end, operator, 'Closed. No action needed.'),
        ],
      };
    case 'duplicate': {
      const original = `INC-${Number(incident.id.slice(4)) - 1}`;
      return {
        priority: openedAt,
        alertCount: 2 + Math.floor(r() * 5),
        handledBy: 'Duplicate detector',
        closeNote: `The same fault as ${original}, raised again while that one was still open.`,
        matched,
        events: [...opening, step(end, 'Duplicate detector', `Closed as a duplicate of ${original}`)],
      };
    }
    case 'worked':
      return {
        priority: 3,
        alertCount: 1 + Math.floor(r() * 4),
        handledBy: operator,
        closeNote: 'Reset the sensor and watched the reading settle. A minor fault, fixed on the spot.',
        matched,
        events: [
          ...opening,
          step(Math.round(end * 0.2), operator, 'Acknowledged'),
          step(Math.round(end * 0.6), operator, 'Reset the sensor on site'),
          step(end, operator, 'Resolved. Minor fault.'),
        ],
      };
    case 'escalated': {
      const priority = r() < 0.5 ? 1 : 2;
      return {
        priority,
        alertCount: 4 + Math.floor(r() * 12),
        handledBy: `${operator}, then the ${group.name} on-call`,
        closeNote:
          'Not a flap. The fault was real and kept getting worse, so it was escalated and worked as a major incident until repaired.',
        matched,
        events: [
          ...opening,
          step(Math.round(end * 0.08), operator, 'Acknowledged'),
          step(Math.round(end * 0.2), operator, `Escalated to the ${group.name} on-call. Raised to P${priority}.`),
          step(end, `${group.name} on-call`, 'Resolved after a repair'),
        ],
      };
    }
  }
}
