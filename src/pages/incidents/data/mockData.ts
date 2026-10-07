/* Mock data: every incident and its journey. This is the file the real backend replaces
 * (one call to search incidents, one to fetch an incident's lifecycle). Nothing else in
 * the app knows the data is fake.
 *
 * The incidents are the Rules page's own: each rule's sample incidents, with the same ids,
 * so an incident opened there is the same incident here. A few more fit no rule at all;
 * those are the real faults, and two of them are with the Imperial Ops team right now.
 *
 * What became of an incident depends on the rules as they stand. An incident only records
 * which rule it fits; `lifecycleOf` decides whether that suppressed it. Approve a rule on
 * the Rules page and its incidents here change from "delivered" to "suppressed". */

import { NOW } from '../../../lib/clock';
import { SAMPLES } from '../../change-windows/data/mockData';
import { RULES, groupById, incidentDetail, serviceGroupById } from '../../rule-management/data/mockData';
import type { RelatedIncident, Rule } from '../../rule-management/model/types';
import type { End, EnrichedField, Lifecycle, Station, Step } from '../model/types';

const MINUTE = 60_000;

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

/** An incident as the feed has it: the row, which rule it fits, and who it belongs to. */
interface Entry {
  incident: RelatedIncident;
  groupId: string;
  ruleId?: string;
  /** It's with the Imperial Ops team right now. */
  pending?: boolean;
}

const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 60 * MINUTE).toISOString();

/** The real faults: no rule fits them. */
const UNMATCHED: Entry[] = (
  [
    ['INC-41208', 'Reactor containment field fluctuating', 'reactor-core-main', 'reactor', 0.07, 'worked', 0, true],
    ['INC-41207', 'Life support pressure dropping, deck 14', 'executor-deck14-air', 'lifesupport', 0.12, 'worked', 0, true],
    ['INC-41201', 'Detention level AA-23 security door forced', 'aa23-blast-door-1', 'detention', 1.4, 'escalated', 212],
    ['INC-41196', 'Hangar bay 327 magnetic seal fault', 'hangar-327-magseal', 'hangar', 3.2, 'worked', 64],
    ['INC-41190', 'HoloNet relay unreachable, Scarif', 'holonet-relay-scarif', 'holonet', 5.5, 'escalated', 341],
    ['INC-41183', 'Hyperdrive coolant leak, ISD Devastator', 'motivator-isd-devastator', 'hyperdrive', 9, 'worked', 97],
    ['INC-41177', 'Tractor beam generator 2 offline', 'tb-generator-02', 'tractor', 14, 'worked', 121],
    ['INC-41169', 'Armory deck 5 door held open', 'armory-deck-5-door', 'armory', 21, 'worked', 38],
    ['INC-41160', 'Trash compactor 3263827 walls not responding', 'compactor-3263827', 'facilities', 30, 'escalated', 188],
    ['INC-41152', 'Reactor coolant pump bank B vibration', 'coolant-pump-bank-b', 'reactor', 44, 'worked', 73],
  ] as const
).map(([id, title, ci, groupId, ago, resolution, minutesOpen, pending]) => ({
  incident: { id, title, ci, openedAt: hoursAgo(ago), resolution, minutesOpen },
  groupId,
  pending,
}));

const RECORDS: Entry[] = [
  ...UNMATCHED,
  ...RULES.flatMap((rule) => rule.related.map((incident) => ({ incident, groupId: rule.groupId, ruleId: rule.id }))),
].sort((a, b) => b.incident.openedAt.localeCompare(a.incident.openedAt));

const OPS = ['Chief Bast', 'Lieutenant Tanbris', 'Commander Praji', 'TK-710'];

const CAUSE: { [groupId: string]: string } = {
  reactor: 'Load imbalance on a main bus. The reading is outside what a shift change explains.',
  tractor: 'A coupling running hot under sustained load, not a transient flap.',
  facilities: 'A mechanical fault. The unit is not responding to a reset.',
  detention: 'A physical breach of a secured door, confirmed by two sensors.',
  lifesupport: 'A slow leak. Pressure has fallen steadily for several minutes.',
  hyperdrive: 'Coolant loss in the motivator loop. Calibration is drifting with it.',
  hangar: 'The seal emitter has failed and the backup is carrying the bay.',
  holonet: 'The relay has stopped answering. Traffic is rerouting through one remaining path.',
  armory: 'A door interlock is reporting open with no drill scheduled.',
};

/** Work out an incident's whole journey, given the rules as they stand. */
function lifecycleOf(record: Entry, rules: Rule[]): Lifecycle {
  const { incident, groupId } = record;
  const r = rng(incident.id + 'life');
  const group = groupById(groupId);
  const rule = record.ruleId ? rules.find((x) => x.id === record.ruleId) : undefined;
  const detail = rule ? incidentDetail(rule, incident) : undefined;
  const raised = new Date(incident.openedAt).getTime();
  const real = incident.resolution === 'worked' || incident.resolution === 'escalated';
  const raisedAt = detail ? (real ? 3 : detail.priority) : 3;
  const priority = detail?.priority ?? (incident.resolution === 'escalated' ? 1 : 2);

  // A few were raised inside a change window for their group: expected, so held.
  const planned = SAMPLES.tidy.find((w) => w.groupId === groupId);
  const window = planned && !real && r() < 0.22 ? { id: planned.id, name: planned.name } : undefined;
  const foldedInto = `INC-${Number(incident.id.slice(4)) - 1}`;

  const end: End = window
    ? 'held'
    : rule?.status === 'active'
      ? 'suppressed'
      : incident.resolution === 'duplicate'
        ? 'folded'
        : !real
          ? 'noise'
          : record.pending
            ? 'enriching'
            : 'delivered';

  // The times it reached each checkpoint. The checks are machines and take fractions of a
  // second; enrichment is people and takes minutes.
  const at = {
    windows: raised + 180 + Math.round(r() * 120),
    rules: raised + 420 + Math.round(r() * 200),
    duplicates: raised + 900 + Math.round(r() * 500),
    enrichment: raised + 2_000 + Math.round(r() * 1_500),
  };
  const enrichTook = (2 + r() * 7) * MINUTE;
  const delivered = at.enrichment + enrichTook;
  const closed = raised + Math.max(incident.minutesOpen * MINUTE, enrichTook + 6 * MINUTE);

  const stopAt = { held: 1, suppressed: 2, folded: 3, noise: 4, enriching: 4, delivered: 5 }[end];
  const verdicts: [Station['id'], number, string][] = [
    ['raised', raised, `By a monitor, at P${raisedAt}`],
    ['windows', at.windows, window ? `Inside ${window.id}. Held.` : 'No planned work covers it'],
    [
      'rules',
      at.rules,
      !rule ? 'No rule fits' : rule.status === 'active' ? `Fits ${rule.id}. Suppressed.` : `Fits ${rule.id}, which is ${rule.status}`,
    ],
    ['duplicates', at.duplicates, end === 'folded' ? `Same as ${foldedInto}. Folded.` : 'Nothing like it is open'],
    [
      'enrichment',
      end === 'noise' ? raised + incident.minutesOpen * MINUTE : at.enrichment,
      end === 'noise' ? 'Cleared on its own. Not sent.' : end === 'enriching' ? 'With the team now' : 'Enriched',
    ],
    ['delivered', delivered, `To ${group.name} at P${priority}`],
  ];
  const stations = verdicts.map(([id, time, verdict], i): Station => {
    if (i > stopAt) return { id, state: 'unreached', verdict: '' };
    const state = i < stopAt ? 'passed' : end === 'enriching' ? 'current' : 'stopped';
    return { id, state, at: time, verdict };
  });

  // What the team adds: the ticket as it was raised, and as they leave it.
  const by = OPS[Math.floor(r() * OPS.length)];
  const similar = 1 + Math.floor(r() * 4);
  const fields: EnrichedField[] = [
    { label: 'Priority', before: `P${raisedAt}`, after: `P${priority}` },
    { label: 'Assignment group', before: 'Unassigned', after: group.name },
    { label: 'Service', before: 'Unknown', after: serviceGroupById(group.serviceGroupId).name },
    { label: 'Likely cause', before: 'None given', after: CAUSE[groupId] },
    { label: 'Runbook', before: 'None linked', after: `RB-${100 + Math.floor(r() * 80)} · ${group.name} first response` },
    { label: 'Seen before', before: 'Not checked', after: `${similar} similar in the last 30 days, ${Math.max(1, similar - 1)} resolved the same way` },
  ];
  // Still with the team: they've got as far as the first two.
  const enrichment =
    end === 'delivered'
      ? { by, sentAt: at.enrichment, doneAt: delivered, fields }
      : end === 'enriching'
        ? { by, sentAt: at.enrichment, fields: fields.map((f, i) => (i < 2 ? f : { ...f, after: undefined })) }
        : undefined;

  const steps: Step[] =
    end !== 'delivered'
      ? []
      : [
          { at: delivered + (1 + r() * 5) * MINUTE, actor: `${group.name} on-call`, text: 'Acknowledged' },
          ...(incident.resolution === 'escalated'
            ? [{ at: delivered + (8 + r() * 10) * MINUTE, actor: `${group.name} on-call`, text: 'Escalated. Worked as a major incident.' }]
            : []),
          { at: closed, actor: `${group.name} on-call`, text: incident.resolution === 'escalated' ? 'Resolved after a repair' : 'Resolved. A minor fault.' },
        ];

  const summary = {
    held: `Raised during ${window?.name ?? 'planned work'}, so it was held back. Nobody was told.`,
    suppressed: real
      ? `Suppressed by ${rule?.id}, and it shouldn't have been: this was a real incident.`
      : `Suppressed by ${rule?.id} less than a second after it was raised. Nobody saw it.`,
    folded: `The same fault as ${foldedInto}, which was already open. It was added to that one.`,
    noise: `It passed every check, then cleared on its own. It was never sent for enrichment.`,
    enriching: `Not noise. It's with the Imperial Ops team now, being enriched before ${group.name} gets it.`,
    delivered: `Not noise. Enriched by ${by} and delivered to ${group.name}.`,
  }[end];

  return {
    incident,
    groupId,
    end,
    real,
    summary,
    stations,
    rule,
    matched: detail?.matched ?? [],
    window,
    foldedInto: end === 'folded' ? foldedInto : undefined,
    enrichment,
    steps,
    alertCount: detail?.alertCount ?? 1 + Math.floor(r() * 6),
    raisedAt,
    priority,
  };
}

/** Every incident with its journey, newest first. */
export const lifecycles = (rules: Rule[]): Lifecycle[] => RECORDS.map((record) => lifecycleOf(record, rules));
