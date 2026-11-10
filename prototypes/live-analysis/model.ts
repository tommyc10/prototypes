/* Throwaway: everything Live analysis works out, with no React in it.
 *
 *   parseCsv      text → a table (quotes, CRLF, and , ; or tab as the separator)
 *   guessMapping  which column is the time, the service, the alert name…
 *   toRows        the table, read through a mapping; rows it can't read are dropped and counted
 *   analyse       rows → the patterns that repeat, each with its figures
 *   fitRules      a pattern against the rule that covers it today, and the one we'd propose
 *   can           who may do what to a pattern, and the sentence to show when they can't
 *   sampleCsv     a file to try it with: twelve weeks of Death Star alerts
 *
 * Every figure on the page is computed here from the rows of the file that was dropped. */

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;

/* ---------- reading a CSV ---------- */

export interface Table {
  headers: string[];
  /** Every line after the header, as its cells. */
  rows: string[][];
  delimiter: string;
}

export function parseCsv(input: string): Table {
  const text = input.replace(/^﻿/, '');
  const firstLine = text.slice(0, text.search(/\r?\n/) === -1 ? text.length : text.search(/\r?\n/));
  const delimiter = [',', ';', '\t'].map((d) => [d, firstLine.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const lines: string[][] = [];
  let cell = '';
  let line: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) {
      line.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      line.push(cell);
      cell = '';
      lines.push(line);
      line = [];
    } else cell += c;
  }
  if (cell !== '' || line.length) {
    line.push(cell);
    lines.push(line);
  }
  const [headers = [], ...rows] = lines.filter((l) => l.some((v) => v.trim() !== ''));
  return { headers: headers.map((h) => h.trim()), rows, delimiter };
}

/* ---------- which column is which ---------- */

export type FieldKey = 'time' | 'service' | 'signature' | 'severity' | 'incident' | 'mins';

export const FIELDS: { key: FieldKey; label: string; required: boolean; match: RegExp }[] = [
  { key: 'time', label: 'Time', required: true, match: /^(opened|created|raised|start|time|date|timestamp|fired|when)/i },
  { key: 'service', label: 'Service', required: true, match: /(service|system|application|^app|component|team|source)/i },
  { key: 'signature', label: 'Alert name', required: true, match: /(alert|name|title|summary|signature|description|check)/i },
  { key: 'severity', label: 'Severity', required: false, match: /(sev|priority|urgency|level)/i },
  { key: 'incident', label: 'Became an incident', required: false, match: /(incident|escalat|major|real)/i },
  { key: 'mins', label: 'Minutes to resolve', required: false, match: /(minute|duration|resolve|mttr|ttr)/i },
];

export const FIELD_LABEL = Object.fromEntries(FIELDS.map((f) => [f.key, f.label])) as Record<FieldKey, string>;

/** Each field's column, by header name. A column answers to one field at most. */
export type Mapping = Partial<Record<FieldKey, string>>;

export function guessMapping(headers: string[]): Mapping {
  const map: Mapping = {};
  const used = new Set<string>();
  for (const f of FIELDS) {
    const hit = headers.find((h) => !used.has(h) && f.match.test(h));
    if (hit) {
      map[f.key] = hit;
      used.add(hit);
    }
  }
  return map;
}

export const missingFields = (map: Mapping) => FIELDS.filter((f) => f.required && !map[f.key]);

/* ---------- rows ---------- */

export interface Row {
  /** Its line in the file (the header is line 1). */
  line: number;
  at: number;
  service: string;
  signature: string;
  /** 1 to 4: P1 pages someone whatever a rule says. */
  sev: number;
  incident: boolean;
  /** Minutes to resolve; NaN when the file doesn't say. */
  mins: number;
}

export interface Dropped {
  line: number;
  why: string;
}

function readTime(v: string): number {
  const s = v.trim();
  if (!s) return NaN;
  const uk = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (uk) return Date.UTC(+uk[3], +uk[2] - 1, +uk[1], +(uk[4] ?? 0), +(uk[5] ?? 0));
  if (/^\d{10}$/.test(s)) return +s * 1000;
  if (/^\d{13}$/.test(s)) return +s;
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s.replace(' ', 'T')}Z`;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Date.parse(s) : t;
}

function readSev(v: string | undefined): number {
  if (!v) return 3;
  const s = v.trim().toLowerCase();
  const n = s.match(/[1-5]/);
  if (n) return Math.min(4, +n[0]);
  if (/crit|sev|page|emerg/.test(s)) return 1;
  if (/high|major/.test(s)) return 2;
  if (/low|info|minor/.test(s)) return 4;
  return 3;
}

const readBool = (v: string | undefined) => !!v && /^(true|yes|y|1|incident|escalated)$/i.test(v.trim());

export function toRows(table: Table, map: Mapping): { rows: Row[]; dropped: Dropped[] } {
  const col = (k: FieldKey) => (map[k] ? table.headers.indexOf(map[k]!) : -1);
  const [iTime, iService, iSig, iSev, iInc, iMins] = (['time', 'service', 'signature', 'severity', 'incident', 'mins'] as FieldKey[]).map(col);
  const rows: Row[] = [];
  const dropped: Dropped[] = [];
  table.rows.forEach((cells, i) => {
    const line = i + 2;
    const at = readTime(cells[iTime] ?? '');
    const service = (cells[iService] ?? '').trim();
    const signature = (cells[iSig] ?? '').trim();
    if (Number.isNaN(at)) return dropped.push({ line, why: 'no readable time' });
    if (!service || !signature) return dropped.push({ line, why: !service ? 'no service' : 'no alert name' });
    rows.push({ line, at, service, signature, sev: readSev(cells[iSev]), incident: readBool(cells[iInc]), mins: iMins < 0 ? NaN : parseFloat(cells[iMins] ?? '') });
  });
  rows.sort((a, b) => a.at - b.at);
  return { rows, dropped };
}

/* ---------- the rules already in place ---------- */

export interface RuleDef {
  id: string;
  name: string;
  service: string;
  /** The alert name contains this. */
  contains: string;
  /** Only between these hours (UTC), end not included. */
  hours?: [number, number];
  /** Only this severity or lower: 3 means P3 and P4. */
  fromSev?: number;
}

export const RULES: RuleDef[] = [
  { id: 'RUL-0412', name: 'Quiet relay heartbeats during the backup', service: 'holonet-relay', contains: 'heartbeat', hours: [1, 3] },
  { id: 'RUL-0430', name: 'Hold emitter queue alerts at shift start', service: 'tractor-beam', contains: 'queue depth' },
  { id: 'RUL-0401', name: 'Mute coolant drift overnight', service: 'reactor-core', contains: 'coolant', hours: [0, 6] },
  { id: 'RUL-0388', name: 'Batch certificate reminders', service: 'shield-generator', contains: 'certificate', fromSev: 4 },
];

const hourOf = (at: number) => new Date(at).getUTCHours();
const two = (n: number) => String(n).padStart(2, '0');
export const hourLabel = (h: number) => `${two(((h % 24) + 24) % 24)}:00`;

/** P1 always pages: no rule, in place or proposed, can hold one back. */
const ruleCatches = (rule: RuleDef, r: Row) =>
  r.sev > 1 &&
  r.service === rule.service &&
  r.signature.toLowerCase().includes(rule.contains) &&
  (!rule.hours || (hourOf(r.at) >= rule.hours[0] && hourOf(r.at) < rule.hours[1])) &&
  (!rule.fromSev || r.sev >= rule.fromSev);

export interface RuleFit {
  /** The rule's id, or nothing for the one we'd propose. */
  id?: string;
  name: string;
  /** Its condition, a line per clause. */
  condition: string[];
  caught: number;
  /** Real incidents among what it catches: pages it hides that mattered. */
  hidden: number;
  lines: Set<number>;
}

function fit(rows: Row[], caught: (r: Row) => boolean, about: Pick<RuleFit, 'id' | 'name' | 'condition'>): RuleFit {
  const own = rows.filter(caught);
  return { ...about, caught: own.length, hidden: own.filter((r) => r.incident).length, lines: new Set(own.map((r) => r.line)) };
}

function fitRules(service: string, signature: string, rows: Row[]) {
  const proposal = fit(rows, (r) => r.sev > 1, {
    name: 'Suppress this pattern',
    condition: [`service = "${service}"`, `alert name = "${signature}"`, 'severity below P1'],
  });
  const fits = RULES.map((rule) =>
    fit(rows, (r) => ruleCatches(rule, r), {
      id: rule.id,
      name: rule.name,
      condition: [
        `service = "${rule.service}"`,
        `alert name contains "${rule.contains}"`,
        ...(rule.hours ? [`between ${hourLabel(rule.hours[0])} and ${hourLabel(rule.hours[1])}`] : []),
        rule.fromSev ? `severity P${rule.fromSev} or lower` : 'severity below P1',
      ],
    }),
  ).filter((f) => f.caught > 0);
  const existing = fits.sort((a, b) => b.caught - a.caught)[0] ?? null;
  return { proposal, existing };
}

/* ---------- patterns ---------- */

export type Advice = 'investigate' | 'suppress' | 'watch';

export const ADVICE_LABEL: Record<Advice, string> = { investigate: 'Worth investigating', suppress: 'Suppression candidate', watch: 'Watch' };

/** The share of a pattern's alerts that became incidents, at or above which it wants a person. */
export const RISKY = 0.08;
/** How regular a pattern has to be before holding it back is safe to propose. */
export const REGULAR = 0.55;
/** A pattern is an alert name on one service, seen this often… */
export const MIN_COUNT = 6;

export interface Pattern {
  key: string;
  id: string;
  service: string;
  signature: string;
  rows: Row[];
  count: number;
  incidents: number;
  incidentShare: number;
  /** Alerts in each week of the window, oldest first; and how many of those became incidents. */
  weeks: number[];
  incidentWeeks: number[];
  weeksActive: number;
  perWeek: number;
  /** Weekday (Monday first) by hour of day. */
  heat: number[][];
  heatMax: number;
  /** The busiest three hours: where they start, how many alerts fell in them, and that as a share. */
  peakFrom: number;
  peakCount: number;
  regularity: number;
  medianMins: number;
  /** The second half of the window against the first: 0.5 is half as many again. */
  trend: number;
  halves: [number, number];
  p1: number;
  advice: Advice;
  why: string;
  existing: RuleFit | null;
  proposal: RuleFit;
  /** Pages a week the proposal would stop, beyond what today's rule already does. */
  saved: number;
}

export interface Scope {
  weeks: number;
  /** A service's name, or 'all'. */
  service: string;
  /** The severities to count. */
  sevs: number[];
}

export interface Analysis {
  scope: Scope;
  /** Where the window starts and ends. */
  from: number;
  to: number;
  rows: Row[];
  patterns: Pattern[];
  /** Different alert names in scope, and how many alerts belong to no pattern. */
  signatures: number;
  loose: number;
  weeklyTotals: number[];
  ruled: number;
}

const median = (values: number[]) => {
  const v = values.filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
  return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : NaN;
};

const keyOf = (r: Row) => `${r.service}\u0001${r.signature}`;

/** The end of the file's last day, and how many whole weeks it reaches back. */
export function extent(rows: Row[]) {
  const last = rows.length ? rows[rows.length - 1].at : 0;
  const to = Math.floor(last / DAY) * DAY + DAY;
  const span = rows.length ? Math.max(1, Math.ceil((to - rows[0].at) / WEEK)) : 1;
  return { to, span };
}

/** Every pattern in the whole file gets its id once, biggest first, so PAT-03 stays PAT-03
 *  whatever the filters say. */
export function identify(rows: Row[]) {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(keyOf(r), (counts.get(keyOf(r)) ?? 0) + 1);
  const ids = new Map<string, string>();
  [...counts]
    .filter(([, n]) => n >= MIN_COUNT)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .forEach(([key], i) => ids.set(key, `PAT-${two(i + 1)}`));
  return ids;
}

export function analyse(all: Row[], scope: Scope, ids: Map<string, string>): Analysis {
  const { to } = extent(all);
  const from = to - scope.weeks * WEEK;
  const rows = all.filter((r) => r.at >= from && r.at < to && (scope.service === 'all' || r.service === scope.service) && scope.sevs.includes(r.sev));
  const weekOf = (at: number) => Math.min(scope.weeks - 1, Math.floor((at - from) / WEEK));

  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const g = groups.get(keyOf(r));
    if (g) g.push(r);
    else groups.set(keyOf(r), [r]);
  }

  const weeklyTotals = Array.from({ length: scope.weeks }, () => 0);
  for (const r of rows) weeklyTotals[weekOf(r.at)]++;

  const patterns: Pattern[] = [];
  for (const [key, own] of groups) {
    const weeks = Array.from({ length: scope.weeks }, () => 0);
    const incidentWeeks = Array.from({ length: scope.weeks }, () => 0);
    const heat = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    const hours = Array.from({ length: 24 }, () => 0);
    for (const r of own) {
      const w = weekOf(r.at);
      weeks[w]++;
      if (r.incident) incidentWeeks[w]++;
      const d = new Date(r.at);
      heat[(d.getUTCDay() + 6) % 7][d.getUTCHours()]++;
      hours[d.getUTCHours()]++;
    }
    const weeksActive = weeks.filter(Boolean).length;
    if (own.length < MIN_COUNT || weeksActive < Math.min(3, Math.ceil(scope.weeks / 2))) continue;

    let peakFrom = 0;
    let peakCount = 0;
    for (let h = 0; h < 24; h++) {
      const n = hours[h] + hours[(h + 1) % 24] + hours[(h + 2) % 24];
      if (n > peakCount) [peakFrom, peakCount] = [h, n];
    }
    const count = own.length;
    const incidents = own.filter((r) => r.incident).length;
    const incidentShare = incidents / count;
    const regularity = peakCount / count;
    const half = Math.floor(scope.weeks / 2);
    const halves: [number, number] = [weeks.slice(0, half).reduce((a, b) => a + b, 0), weeks.slice(scope.weeks - half).reduce((a, b) => a + b, 0)];
    const trend = (halves[1] - halves[0]) / Math.max(1, halves[0]);
    const { service, signature } = own[0];
    const { proposal, existing } = fitRules(service, signature, own);

    let advice: Advice = 'watch';
    let why = `Irregular, and ${incidents ? `${incidents} of ${count} became incidents` : 'none became an incident'}: not safe to hold back yet, not urgent either.`;
    if (existing && existing.hidden > 0) {
      advice = 'investigate';
      why = `${existing.id} is already hiding ${existing.hidden} real ${existing.hidden === 1 ? 'incident' : 'incidents'} from this pattern.`;
    } else if (incidentShare >= RISKY) {
      advice = 'investigate';
      why = `${incidents} of ${count} became real incidents. Holding these back would hide them.`;
    } else if (trend >= 0.6 && count >= 20) {
      advice = 'investigate';
      why = `Growing: ${halves[1]} in the last ${half} weeks against ${halves[0]} in the ${half} before.`;
    } else if (incidents === 0 && regularity >= REGULAR) {
      advice = 'suppress';
      why = `${peakCount} of ${count} arrive between ${hourLabel(peakFrom)} and ${hourLabel(peakFrom + 3)}, and none became an incident.`;
    }

    patterns.push({
      key,
      id: ids.get(key) ?? 'PAT-00',
      service,
      signature,
      rows: own,
      count,
      incidents,
      incidentShare,
      weeks,
      incidentWeeks,
      weeksActive,
      perWeek: count / scope.weeks,
      heat,
      heatMax: Math.max(...heat.flat()),
      peakFrom,
      peakCount,
      regularity,
      medianMins: median(own.map((r) => r.mins)),
      trend,
      halves,
      p1: own.filter((r) => r.sev === 1).length,
      advice,
      why,
      existing,
      proposal,
      saved: (proposal.caught - (existing?.caught ?? 0)) / scope.weeks,
    });
  }
  patterns.sort((a, b) => b.count - a.count);

  const inPattern = patterns.reduce((n, p) => n + p.count, 0);
  return { scope, from, to, rows, patterns, signatures: groups.size, loose: rows.length - inPattern, weeklyTotals, ruled: patterns.filter((p) => p.existing).length };
}

/* ---------- the working, shown ---------- */

export interface Calc {
  label: string;
  value: string;
  /** How the value was reached, with this pattern's own numbers in it. */
  working: string;
  tone?: 'red' | 'orange';
}

const one = (n: number) => (Math.round(n * 10) / 10).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const perWeek = (n: number) => `${one(n)} a week`;
export const share = (n: number) => `${Math.round(n * 100)}%`;
export const mins = (m: number) => (Number.isNaN(m) ? 'Not in the file' : m < 60 ? `${Math.round(m)} min` : `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`);
export const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n * 100))}%`;

export function calcs(p: Pattern, a: Analysis): Calc[] {
  const half = Math.floor(a.scope.weeks / 2);
  return [
    { label: 'Recurrence', value: perWeek(p.perWeek), working: `${p.count} alerts ÷ ${a.scope.weeks} weeks, seen in ${p.weeksActive} of them` },
    { label: 'Regularity', value: share(p.regularity), working: `${p.peakCount} of ${p.count} arrived between ${hourLabel(p.peakFrom)} and ${hourLabel(p.peakFrom + 3)}`, tone: p.regularity < REGULAR ? 'orange' : undefined },
    { label: 'Became incidents', value: share(p.incidentShare), working: `${p.incidents} of ${p.count} alerts, ${p.p1} of them P1`, tone: p.incidentShare >= RISKY ? 'red' : undefined },
    { label: 'Median time to resolve', value: mins(p.medianMins), working: Number.isNaN(p.medianMins) ? 'No duration column was matched' : `the middle of ${p.count} durations` },
    { label: 'Trend', value: signed(p.trend), working: `${p.halves[1]} in the last ${half} weeks against ${p.halves[0]} in the ${half} before` },
    { label: 'Pages the proposal stops', value: perWeek(p.saved), working: `(${p.proposal.caught} caught − ${p.existing?.caught ?? 0} already caught) ÷ ${a.scope.weeks} weeks` },
    { label: 'Real incidents it would hide', value: String(p.proposal.hidden), working: `incidents among the ${p.proposal.caught} alerts it catches; P1 always pages`, tone: p.proposal.hidden ? 'red' : undefined },
  ];
}

/* ---------- review: who may do what ---------- */

export type Role = 'analyst' | 'governor' | 'viewer';
export type Status = 'new' | 'investigating' | 'proposed' | 'approved' | 'rejected' | 'dismissed';
export type Act = 'investigate' | 'propose' | 'dismiss' | 'approve' | 'reject' | 'reopen';

export const PEOPLE: Record<Role, { name: string; title: string }> = {
  governor: { name: 'Admiral Piett', title: 'Rule governor' },
  analyst: { name: 'Moff Jerjerrod', title: 'Analyst' },
  viewer: { name: 'Lieutenant Venka', title: 'Viewer' },
};

export const STATUS_LABEL: Record<Status, string> = { new: 'Found', investigating: 'Investigating', proposed: 'Proposed', approved: 'Approved', rejected: 'Rejected', dismissed: 'Dismissed' };
export const ACT_LABEL: Record<Act, string> = { investigate: 'Investigate', propose: 'Propose suppression', dismiss: 'Dismiss', approve: 'Approve', reject: 'Reject', reopen: 'Reopen' };
export const ACT_PAST: Record<Act, string> = { investigate: 'under investigation', propose: 'proposed for suppression', dismiss: 'dismissed', approve: 'approved', reject: 'rejected', reopen: 'reopened' };
const ACT_DONE: Record<Act, string> = { investigate: 'investigated', propose: 'proposed', dismiss: 'dismissed', approve: 'approved', reject: 'rejected', reopen: 'reopened' };
export const ACT_STATUS: Record<Act, Status> = { investigate: 'investigating', propose: 'proposed', dismiss: 'dismissed', approve: 'approved', reject: 'rejected', reopen: 'new' };
export const ACT_KEY: Partial<Record<Act, string>> = { investigate: 'I', propose: 'P', dismiss: 'X', approve: 'A', reject: 'X' };
/** A written reason, as on the Rules page. Investigating and reopening only claim the pattern. */
export const NEEDS_REASON: Act[] = ['propose', 'dismiss', 'approve', 'reject'];
export const MIN_REASON = 12;

export interface ReviewEvent {
  at: number;
  who: string;
  act: Act;
  note?: string;
}

export interface Review {
  status: Status;
  owner?: string;
  events: ReviewEvent[];
}

export const NO_REVIEW: Review = { status: 'new', events: [] };

const FROM: Record<Act, Status[]> = {
  investigate: ['new'],
  propose: ['new', 'investigating'],
  dismiss: ['new', 'investigating'],
  approve: ['proposed'],
  reject: ['proposed'],
  reopen: ['approved', 'rejected', 'dismissed'],
};

/** What this role can do to a pattern in this status, in the order the buttons show. */
export function actsFor(status: Status): Act[] {
  return (['investigate', 'dismiss', 'reject', 'reopen', 'propose', 'approve'] as Act[]).filter((a) => FROM[a].includes(status));
}

/** May they? And when they may not, the sentence that says why. */
export function can(role: Role, act: Act, status: Status): { ok: boolean; why?: string } {
  if (!FROM[act].includes(status)) return { ok: false, why: `Only a pattern that is ${FROM[act].map((s) => STATUS_LABEL[s].toLowerCase()).join(' or ')} can be ${ACT_DONE[act]}.` };
  if (role === 'viewer') return { ok: false, why: 'Viewers can read an analysis, not change it.' };
  if ((act === 'approve' || act === 'reject') && role !== 'governor') return { ok: false, why: 'Only a rule governor can approve or reject a proposal.' };
  return { ok: true };
}

/* ---------- export ---------- */

const csvCell = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const csv = (lines: (string | number)[][]) => lines.map((l) => l.map(csvCell).join(',')).join('\n') + '\n';

export const patternsCsv = (a: Analysis, statusOf: (key: string) => Status) =>
  csv([
    ['pattern', 'service', 'alert_name', 'status', 'advice', 'alerts', 'per_week', 'regularity', 'became_incidents', 'median_minutes', 'covered_by', 'proposal_stops_per_week', 'proposal_hides_incidents'],
    ...a.patterns.map((p) => [p.id, p.service, p.signature, statusOf(p.key), p.advice, p.count, one(p.perWeek), share(p.regularity), share(p.incidentShare), Number.isNaN(p.medianMins) ? '' : Math.round(p.medianMins), p.existing?.id ?? '', one(p.saved), p.proposal.hidden]),
  ]);

export const evidenceCsv = (p: Pattern) =>
  csv([['pattern', 'file_line', 'time', 'service', 'alert_name', 'severity', 'became_incident', 'minutes_to_resolve'], ...p.rows.map((r) => [p.id, r.line, new Date(r.at).toISOString(), r.service, r.signature, `P${r.sev}`, r.incident ? 'true' : 'false', Number.isNaN(r.mins) ? '' : r.mins])]);

export function download(name: string, text: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- words ---------- */

export const dayMonth = (at: number) => new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const clock = (at: number) => `${two(new Date(at).getUTCHours())}:${two(new Date(at).getUTCMinutes())}`;
export const count = (n: number) => n.toLocaleString('en-GB');
export const plural = (n: number, word: string, many = `${word}s`) => (n === 1 ? word : many);
export const bytes = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${one(n / 1024 / 1024)} MB`);

/* ---------- a file to try it with ---------- */

export const SAMPLE_NAME = 'death-star-alerts-q3.csv';

function mulberry(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Twelve weeks of alerts, ending Sunday 27 Sept 2026, with thirteen things that repeat planted
 *  among a few hundred that don't. The same file every time. */
export function sampleCsv(): string {
  const r = mulberry(4077);
  const end = Date.UTC(2026, 8, 28);
  const start = end - 12 * WEEK;
  const out: { at: number; cells: (string | number)[] }[] = [];
  const pick = <T,>(list: T[]) => list[Math.floor(r() * list.length)];
  const people = ['k.ozzel', 'f.needa', 'm.veers', 'l.venka', 't.jerjerrod'];
  const add = (at: number, service: string, name: string, sev: number, incident: boolean, minutes: number) =>
    out.push({ at, cells: [new Date(Math.floor(at / 60000) * 60000).toISOString().replace('.000Z', 'Z'), service, name, `P${sev}`, incident ? 'true' : 'false', Math.max(1, Math.round(minutes)), `${service}-${two(1 + Math.floor(r() * 6))}`, pick(people)] });
  const around = (m: number) => m * (0.6 + r() * 0.9);

  for (let d = 0; d < 84; d++) {
    const day = start + d * DAY;
    const dow = (new Date(day).getUTCDay() + 6) % 7; // Monday = 0
    const week = Math.floor(d / 7);
    const weekday = dow < 5;

    // Every night, while the backup runs: regular and harmless. A rule covers part of it.
    if (r() < 0.96) add(day + (1.1 + r() * 2.7) * HOUR, 'holonet-relay', 'Relay heartbeat missed', 4, false, around(6));
    if (r() < 0.31) add(day + (1.6 + r() * 2.2) * HOUR, 'holonet-relay', 'Relay failover completed', 4, false, around(3));
    // Monday mornings: the certificate reminder, once per host.
    if (dow === 0) for (let i = 0; i < 2 + (r() < 0.5 ? 1 : 0); i++) add(day + (8.2 + r() * 2.6) * HOUR, 'shield-generator', 'Certificate expires within 14 days', r() < 0.7 ? 4 : 3, false, around(12));
    // Shift start on weekdays. A rule already holds all of these.
    if (weekday) for (let i = 0; i < 1 + Math.floor(r() * 3); i++) add(day + (8.4 + r() * 2.4) * HOUR, 'tractor-beam', 'Emitter queue depth above 5,000', 3, r() < 0.012, around(9));
    // Any hour, and one in four is real. The overnight rule is hiding some of those.
    if (r() < 0.5) add(day + r() * 24 * HOUR, 'reactor-core', 'Coolant pressure drift', r() < 0.12 ? 1 : r() < 0.5 ? 2 : 3, r() < 0.26, around(48));
    // Growing week on week.
    for (let i = 0; i < Math.round((0.15 + week * 0.16) * (0.5 + r())); i++) add(day + (9 + r() * 10) * HOUR, 'hyperdrive', 'Motivator latency above 400 ms', r() < 0.3 ? 2 : 3, r() < 0.07, around(34));
    // Bursts with no rhythm.
    if (r() < 0.16) {
      const at = day + r() * 23 * HOUR;
      for (let i = 0; i < 4 + Math.floor(r() * 5); i++) add(at + r() * HOUR, 'docking-bay', 'Bay door sensor flapping', 4, false, around(4));
    }
    // Noon and midnight, more or less.
    if (r() < 0.62) add(day + (11.4 + r() * 1.6) * HOUR, 'turbolaser-grid', 'Targeting sync retry', 4, false, around(2));
    if (r() < 0.55) add(day + ((23.3 + r() * 1.5) % 24) * HOUR, 'turbolaser-grid', 'Targeting sync retry', 4, false, around(2));
    // Weekday afternoons, now and then real.
    if (weekday && r() < 0.72) add(day + (13.6 + r() * 2.8) * HOUR, 'life-support', 'CO2 scrubber duty cycle high', 3, r() < 0.045, around(22));
    if (r() < 0.36) add(day + r() * 24 * HOUR, 'comms-array', 'Uplink packet loss above 2%', r() < 0.4 ? 2 : 3, r() < 0.18, around(41));
    // Sunday 03:00, the maintenance restart.
    if (dow === 6) for (let i = 0; i < 2; i++) add(day + (2.7 + r() * 1.2) * HOUR, 'detention-block', 'Cell door controller restart', 4, false, around(5));
    if (r() < 0.17) add(day + r() * 24 * HOUR, 'hyperdrive', 'Navicomputer cache evictions', 3, r() < 0.07, around(15));
    if (r() < 0.11) add(day + r() * 24 * HOUR, 'reactor-core', 'Exhaust port thermal variance', r() < 0.5 ? 1 : 2, r() < 0.55, around(96));
    // And the things that happen once.
    const services = ['holonet-relay', 'reactor-core', 'tractor-beam', 'hyperdrive', 'shield-generator', 'turbolaser-grid', 'docking-bay', 'detention-block', 'life-support', 'comms-array'];
    const checks = ['Disk latency high on node', 'Unexpected restart of unit', 'Config drift detected on deck', 'Probe timeout from sector', 'Memory pressure on controller'];
    for (let i = 0; i < 1 + Math.floor(r() * 3); i++) add(day + r() * 24 * HOUR, pick(services), `${pick(checks)} ${100 + Math.floor(r() * 899)}`, 2 + Math.floor(r() * 3), r() < 0.05, around(18));
  }

  out.sort((a, b) => a.at - b.at);
  const lines = out.map((o) => o.cells);
  // Real exports are never clean.
  lines.splice(117, 0, ['', 'comms-array', 'Uplink packet loss above 2%', 'P3', 'false', 14, 'comms-array-02', 'f.needa']);
  lines.splice(406, 0, ['n/a', 'docking-bay', 'Bay door sensor flapping', 'P4', 'false', 3, 'docking-bay-04', 'k.ozzel']);
  lines.splice(732, 0, ['2026-09-17T11:02:00Z', '', 'Probe timeout from sector 418', 'P3', 'false', 8, '', 'm.veers']);
  return csv([['opened_at', 'service', 'alert_name', 'severity', 'became_incident', 'minutes_to_resolve', 'ci', 'assigned_to'], ...lines]);
}

/* ---------- the live feed ---------- */

/** What the live feed is called wherever a file's name would show. */
export const LIVE_NAME = 'Live alert feed';

/** The feed's history when you connect: the sample's twelve weeks, moved so the newest alert
 *  arrived a few minutes ago. A real backend sends its own history instead. */
export function liveHistory(now: number): Row[] {
  const table = parseCsv(sampleCsv());
  const { rows } = toRows(table, guessMapping(table.headers));
  // Whole weeks, so every alert keeps its weekday and hour: the rules and the rhythms depend on
  // them. Whatever would land after now hasn't happened yet, so it's left out.
  const shift = Math.ceil((now - rows[rows.length - 1].at) / WEEK) * WEEK;
  return rows
    .map((r) => ({ ...r, at: r.at + shift }))
    .filter((r) => r.at <= now)
    .map((r, i) => ({ ...r, line: i + 1 }));
}

/** One new alert, as the feed would send it. Prototype only: it repeats what the history holds,
 *  in the same proportions, so the patterns keep growing the way they already were; one in
 *  twelve is something that happens once. */
export function nextLive(history: Row[], now: number, line: number): Row {
  const r = Math.random;
  if (r() < 1 / 12) {
    const services = [...new Set(history.map((h) => h.service))];
    const checks = ['Disk latency high on node', 'Unexpected restart of unit', 'Probe timeout from sector', 'Memory pressure on controller'];
    return { line, at: now, service: services[Math.floor(r() * services.length)], signature: `${checks[Math.floor(r() * checks.length)]} ${100 + Math.floor(r() * 899)}`, sev: 2 + Math.floor(r() * 3), incident: r() < 0.05, mins: NaN };
  }
  // What usually arrives at this hour on this weekday, so a rhythm stays a rhythm; anything from
  // this hour on another day, or anything at all, if the history is quiet then.
  const hour = (t: number) => new Date(t).getUTCHours();
  const day = (t: number) => new Date(t).getUTCDay();
  const near = (h: Row) => Math.min(Math.abs(hour(h.at) - hour(now)), 24 - Math.abs(hour(h.at) - hour(now))) <= 1;
  const sameDay = history.filter((h) => near(h) && day(h.at) === day(now));
  const sameHour = sameDay.length >= 3 ? sameDay : history.filter(near);
  const pool = sameHour.length >= 3 ? sameHour : history;
  const like = pool[Math.floor(r() * pool.length)];
  return { ...like, line, at: now, mins: NaN };
}

/** Gives a pattern that has just reached MIN_COUNT the next free id, so ids never renumber
 *  while the feed runs. Returns the same map when nothing changed. */
export function extendIds(ids: Map<string, string>, rows: Row[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(keyOf(r), (counts.get(keyOf(r)) ?? 0) + 1);
  const fresh = [...counts].filter(([key, n]) => n >= MIN_COUNT && !ids.has(key));
  if (!fresh.length) return ids;
  const next = new Map(ids);
  for (const [key] of fresh) next.set(key, `PAT-${two(next.size + 1)}`);
  return next;
}
