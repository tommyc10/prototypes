/* Two years of tickets, made up but deterministic: the same every load. In the real app this
 * file is replaced by the ticket store and the pattern miner; nothing else changes.
 *
 * The history is shaped so the page has something true to find: each service has its usual
 * causes, causes keep their own hours, a migration in the spring made a rough month, time to
 * resolve has been coming down, and six patterns are planted at the rate their evidence shows. */

import { GROUPS } from '../../rule-management/data/mockData';
import { DAY, TODAY, WEEK } from '../model/labels';
import { chances } from '../model/patterns';
import type { CauseKey, Outcome, Pattern, Ticket } from '../model/types';

export const HISTORY_WEEKS = 104;
export const HISTORY_START = TODAY - HISTORY_WEEKS * WEEK;

export const SERVICES = GROUPS.map((g) => ({ id: g.id, name: g.name, unit: g.unit }));
export const serviceName = (id: string) => SERVICES.find((s) => s.id === id)?.name ?? 'All services';

export const PATTERNS: Pattern[] = [
  {
    id: 'PAT-01',
    title: 'Motivator faults the day after recalibration',
    serviceId: 'hyperdrive',
    cause: 'hardware',
    cadence: { kind: 'weekday', day: 2 },
    when: 'Every Wednesday',
    windowDays: 1,
    action: 'Stage a spare motivator before Tuesday’s window',
  },
  {
    id: 'PAT-02',
    title: 'Comlink certificates lapse every 91 days',
    serviceId: 'holonet',
    cause: 'certificate',
    cadence: { kind: 'cycle', everyDays: 91, anchor: '2025-10-14' },
    when: 'Every 91 days',
    windowDays: 1,
    action: 'Rotate the comlink certificates before they lapse',
  },
  {
    id: 'PAT-03',
    title: 'Reactor capacity runs short at month end',
    serviceId: 'reactor',
    cause: 'capacity',
    cadence: { kind: 'month-end', daysBefore: 3 },
    when: 'Last 3 days of the month',
    windowDays: 3,
    action: 'Bring the reserve cells online on the 27th',
  },
  {
    id: 'PAT-04',
    title: 'Thursday releases break the hangar',
    serviceId: 'hangar',
    cause: 'deploy',
    cadence: { kind: 'weekday', day: 3 },
    when: 'Every Thursday',
    windowDays: 1,
    action: 'Move hangar releases to Tuesday mornings',
  },
  {
    id: 'PAT-05',
    title: 'Sensor faults follow the four-weekly filter swap',
    serviceId: 'lifesupport',
    cause: 'hardware',
    cadence: { kind: 'cycle', everyDays: 28, anchor: '2025-10-05' },
    when: 'Every 4 weeks, Sunday',
    windowDays: 2,
    action: 'Recalibrate the atmosphere sensors after each swap',
  },
  {
    id: 'PAT-06',
    title: 'Monday morning upstream timeouts',
    serviceId: 'tractor',
    cause: 'dependency',
    cadence: { kind: 'weekday', day: 0 },
    when: 'Every Monday, 08:00',
    windowDays: 1,
    action: 'Ask the power grid team about their Monday restarts',
  },
];

/** How often each planted pattern actually happens. */
const PATTERN_RATE: Record<string, number> = { 'PAT-01': 0.74, 'PAT-02': 1, 'PAT-03': 0.72, 'PAT-04': 0.58, 'PAT-05': 0.84, 'PAT-06': 0.36 };
/** The hour a planted pattern's tickets arrive. */
const PATTERN_HOUR: Record<string, number> = { 'PAT-01': 6, 'PAT-02': 0, 'PAT-03': 19, 'PAT-04': 15, 'PAT-05': 3, 'PAT-06': 8 };

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

function weighted<K extends string | number>(r: () => number, weights: [K, number][]): K {
  let at = r() * weights.reduce((n, [, w]) => n + w, 0);
  for (const [key, w] of weights) if ((at -= w) < 0) return key;
  return weights[weights.length - 1][0];
}

/** Roughly normal, mean 0 and sd 1. */
const gauss = (r: () => number) => (r() + r() + r() + r() - 2) * 1.73;

/* ---------- what each service and cause looks like ---------- */

const BASE: Record<string, number> = {
  reactor: 11,
  tractor: 5,
  facilities: 8,
  detention: 4,
  lifesupport: 7,
  hyperdrive: 6,
  hangar: 9,
  holonet: 10,
  armory: 5,
};

const CAUSE_MIX: Record<CauseKey, number> = { deploy: 18, config: 14, capacity: 15, hardware: 14, dependency: 12, network: 10, certificate: 2, unknown: 15 };

const SERVICE_MIX: Record<string, Partial<Record<CauseKey, number>>> = {
  hangar: { deploy: 32 },
  hyperdrive: { hardware: 30 },
  holonet: { network: 22, certificate: 4 },
  reactor: { capacity: 30 },
  lifesupport: { hardware: 24 },
  tractor: { dependency: 22 },
  armory: { config: 22 },
};

const CI: Record<string, string[]> = {
  reactor: ['core-cell-04', 'reactor-mgr', 'plasma-loop-2', 'grid-feed-A'],
  tractor: ['tb-emitter-7', 'tb-control', 'tb-power-bus'],
  facilities: ['turbolift-12', 'blast-door-svc', 'hvac-deck-9'],
  detention: ['cell-lock-AA23', 'det-cam-net', 'det-access'],
  lifesupport: ['atmo-recycler-3', 'o2-sensor-grid', 'scrubber-B'],
  hyperdrive: ['motivator-x2', 'hd-nav-comp', 'hd-coolant'],
  hangar: ['tie-launch-ctl', 'hangar-api', 'flight-roster'],
  holonet: ['comlink-relay-5', 'holonet-gw', 'isb-mail'],
  armory: ['inventory-db', 'armory-portal', 'requisition-q'],
};

const TITLES: Record<CauseKey, string[]> = {
  deploy: ['Error rate up after release on {ci}', 'Release left {ci} returning 500s', 'Rollback needed on {ci}'],
  config: ['Config drift on {ci}', 'Flag flipped without review on {ci}', 'Wrong limits pushed to {ci}'],
  capacity: ['Queue saturated on {ci}', 'Storage at 95% on {ci}', '{ci} out of headroom'],
  hardware: ['Coolant pump fault on {ci}', 'Power coupling failed on {ci}', 'Sensor reading out of range on {ci}'],
  dependency: ['{ci} timing out on upstream', 'Upstream outage reached {ci}', 'Slow responses from {ci}’s provider'],
  network: ['Packet loss between {ci} and relay', '{ci} unreachable from deck 4', 'Route flap near {ci}'],
  certificate: ['Certificate expired on {ci}', 'TLS handshake failing on {ci}'],
  unknown: ['Intermittent fault on {ci}, cleared', '{ci} restarted with no clear reason', 'Brief alarm on {ci}'],
};

const FIX: Record<CauseKey, string[]> = {
  deploy: ['Rolled back the release', 'Hotfix shipped'],
  config: ['Reverted the config', 'Restored the previous limits'],
  capacity: ['Scaled out', 'Cleared old data'],
  hardware: ['Replaced the part', 'Reseated the coupling'],
  dependency: ['Waited for upstream', 'Failed over to standby'],
  network: ['Rerouted traffic', 'Replaced a relay link'],
  certificate: ['Rotated the certificate'],
  unknown: ['Cleared on its own', 'Restarted the service'],
};

/** Typical minutes to resolve, by cause. */
const RESOLVE: Record<CauseKey, number> = { deploy: 70, config: 50, capacity: 90, hardware: 260, dependency: 120, network: 80, certificate: 45, unknown: 30 };

/** Share of tickets that become incidents, and that are cancelled, by cause. */
const OUTCOME_MIX: Record<CauseKey, [number, number]> = {
  deploy: [0.17, 0.22],
  config: [0.13, 0.26],
  capacity: [0.14, 0.28],
  hardware: [0.19, 0.18],
  dependency: [0.11, 0.34],
  network: [0.12, 0.3],
  certificate: [0.45, 0.05],
  unknown: [0.04, 0.55],
};

/** When in the week each cause tends to land: weights by weekday (Mon first) and by hour. */
function when(cause: CauseKey, r: () => number): [number, number] {
  const weekdays: [number, number][] =
    cause === 'deploy'
      ? [[0, 6], [1, 14], [2, 15], [3, 16], [4, 8], [5, 1], [6, 1]]
      : cause === 'hardware' || cause === 'network'
        ? [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 0.9], [6, 0.9]]
        : [[0, 5], [1, 5], [2, 5], [3, 5], [4, 4], [5, 2], [6, 2]];
  const day = weighted(r, weekdays);
  const hours: [number, number][] = Array.from({ length: 24 }, (_, h) => {
    if (cause === 'deploy') return [h, h >= 13 && h <= 18 ? 9 : h >= 9 && h <= 20 ? 2 : 0.3];
    if (cause === 'capacity') return [h, (h >= 8 && h <= 11) || (h >= 18 && h <= 21) ? 6 : 1];
    if (cause === 'certificate') return [h, h <= 1 ? 10 : 0.2];
    if (cause === 'hardware' || cause === 'network') return [h, h >= 1 && h <= 5 ? 2 : 1];
    return [h, h >= 8 && h <= 18 ? 3 : 1];
  });
  return [day, weighted(r, hours)];
}

/* ---------- the tickets ---------- */

function makeTicket(r: () => number, serviceId: string, cause: CauseKey, at: number, forced?: Outcome): Omit<Ticket, 'id' | 'repeat'> {
  const ci = CI[serviceId][Math.floor(r() * CI[serviceId].length)];
  const pool = TITLES[cause];
  const [incidentShare, cancelledShare] = OUTCOME_MIX[cause];
  const roll = r();
  const outcome: Outcome = forced ?? (roll < incidentShare ? 'incident' : roll < incidentShare + cancelledShare ? 'cancelled' : 'worked');
  // Time to resolve has come down by about a third across the two years.
  const age = (at - HISTORY_START) / (TODAY - HISTORY_START);
  const factor = outcome === 'incident' ? 1.7 : outcome === 'cancelled' ? 0.3 : 1;
  const resolveMins = Math.max(4, RESOLVE[cause] * factor * (1.2 - 0.38 * age) * Math.exp(gauss(r) * 0.55));
  return {
    title: pool[Math.floor(r() * pool.length)].replace('{ci}', ci),
    ci,
    serviceId,
    openedAt: new Date(at).toISOString(),
    at,
    outcome,
    cause,
    fix: outcome === 'cancelled' ? 'Cancelled: no action needed' : FIX[cause][Math.floor(r() * FIX[cause].length)],
    resolveMins: Math.round(resolveMins),
  };
}

function generate(): Ticket[] {
  const raw: Omit<Ticket, 'id' | 'repeat'>[] = [];

  for (let w = 0; w < HISTORY_WEEKS; w++) {
    const monday = HISTORY_START + w * WEEK;
    // A slow half-yearly swell, a gentle rise, and the rough month of the spring migration.
    const season = 1 + 0.16 * Math.sin((2 * Math.PI * w) / 26) + 0.0025 * w;
    const migration = w >= 80 && w <= 84 ? 1.45 : 1;
    for (const service of SERVICES) {
      const r = rng(`${service.id}-${w}`);
      const n = Math.max(0, Math.round(BASE[service.id] * season * migration * (1 + gauss(r) * 0.16)));
      const mix = Object.entries({ ...CAUSE_MIX, ...SERVICE_MIX[service.id] }) as [CauseKey, number][];
      for (let i = 0; i < n; i++) {
        const cause = weighted(r, mix);
        const [day, hour] = when(cause, r);
        const at = monday + day * DAY + hour * 3_600_000 + Math.floor(r() * 3_600_000);
        raw.push(makeTicket(r, service.id, cause, at));
      }
    }
  }

  // The planted patterns, each at its own rate.
  for (const pattern of PATTERNS) {
    for (const chance of chances(pattern, HISTORY_START, TODAY)) {
      const r = rng(`${pattern.id}-${chance}`);
      if (r() >= PATTERN_RATE[pattern.id]) continue;
      const count = pattern.cause === 'certificate' ? 2 : 1 + Math.floor(r() * 2);
      for (let i = 0; i < count; i++) {
        const day = Math.floor(r() * pattern.windowDays);
        const at = chance + day * DAY + PATTERN_HOUR[pattern.id] * 3_600_000 + Math.floor(r() * 5_400_000);
        if (at >= TODAY) continue;
        raw.push(makeTicket(r, pattern.serviceId, pattern.cause, at, pattern.cause === 'certificate' && i === 0 ? 'incident' : undefined));
      }
    }
  }

  raw.sort((a, b) => a.at - b.at);
  const lastSeen = new Map<string, number>();
  return raw.map((t, i) => {
    const key = `${t.ci}:${t.cause}`;
    const before = lastSeen.get(key);
    lastSeen.set(key, t.at);
    return { ...t, id: `TKT-${String(30000 + i * 3 + (i % 3)).padStart(5, '0')}`, repeat: before !== undefined && t.at - before <= 3 * DAY };
  });
}

export const TICKETS: Ticket[] = generate();
