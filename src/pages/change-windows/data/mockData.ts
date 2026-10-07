/* Mock data: the change windows around now. This is the file the real backend replaces
 * (the change calendar, plus a count of the alerts each window held back). Nothing else
 * in the app knows the data is fake.
 *
 * The ticket numbers and names match the windows the Hindcast page talks about, so the
 * two pages describe the same estate. Times are written in hours from now. */

import { NOW } from '../../../lib/clock';
import type { ChangeWindow } from '../model/types';

const HOUR = 3_600_000;
const now = NOW.getTime();

/** The same numbers for the same seed, every time. */
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

interface Draft extends Omit<ChangeWindow, 'key' | 'start' | 'plannedEnd' | 'closedAt' | 'held'> {
  /** Hours from now: when it starts, when it's planned to end, and when it was closed. */
  start: number;
  end: number;
  closed?: number;
  /** About how many alerts it holds back in half an hour. */
  rate: number;
}

function build(d: Draft): ChangeWindow {
  const { end, closed, rate, ...rest } = d;
  const start = now + d.start * HOUR;
  const closedAt = closed === undefined ? undefined : now + closed * HOUR;
  const r = rng(d.id + d.start);
  // One count for each half hour it has been in place so far.
  const halfHours = Math.max(0, Math.ceil((Math.min(closedAt ?? now, now) - start) / (HOUR / 2)));
  return {
    ...rest,
    key: `${d.id}@${d.start}`,
    start,
    plannedEnd: now + end * HOUR,
    closedAt,
    held: Array.from({ length: halfHours }, (_, i) => Math.round(rate * (0.4 + r() * 1.2) * (i === 0 ? 1.6 : 1))),
  };
}

export const WINDOWS: ChangeWindow[] = (
  [
    // ---------- in place now ----------
    {
      id: 'CHG-2342', name: 'Turbolift 3 door actuator replacement', groupId: 'facilities', start: -5.35, end: -1.35, rate: 4,
      schedule: 'One-off', cis: 'turbolift-03-*', raisedBy: 'Chief Bast', approvedBy: 'Moff Jerjerrod',
      reason: 'The deck 12 door actuator is being swapped. The car is locked out, so its door and position sensors will alarm until it is back.',
    },
    {
      id: 'CHG-2291', name: 'Reactor load rebalance', groupId: 'reactor', start: -0.33, end: 0.17, rate: 9,
      schedule: 'Every shift change', cis: 'reactor-bus-*', raisedBy: 'Reactor Core on-call', approvedBy: 'Standing approval',
      reason: 'Load moves between the main buses at every shift change. Output and distribution alarms are expected for a few minutes.',
    },
    {
      id: 'CHG-2410', name: 'HoloNet relay firmware, Ord Mantell', groupId: 'holonet', start: -0.83, end: 1.17, rate: 6,
      schedule: 'One-off', cis: 'holonet-relay-ord-mantell', raisedBy: 'Lieutenant Tanbris', approvedBy: 'Admiral Piett',
      reason: 'The relay restarts twice during the upgrade. Packet loss and unreachable alarms are expected each time.',
    },
    {
      id: 'CHG-2398', name: 'Superlaser test firing', groupId: 'reactor', start: -3.33, end: 2.67, rate: 11,
      schedule: 'One-off', cis: 'superlaser-*', raisedBy: 'Commander Praji', approvedBy: 'Grand Moff Tarkin',
      reason: 'A full pre-charge and a low-power firing. Capacitor and tributary beam alarms are expected throughout.',
    },
    {
      id: 'CHG-2371', name: 'Inspection for the Emperor’s arrival', groupId: 'armory', start: -31.3, end: 26.7, rate: 3,
      schedule: 'One-off', cis: 'armory-*', raisedBy: 'Moff Jerjerrod', approvedBy: 'Admiral Piett',
      reason: 'Every vault is locked for a full count and the parade equipment is out of its racks. Inventory alarms are expected.',
    },
    // ---------- upcoming ----------
    {
      id: 'CHG-2291', name: 'Reactor load rebalance', groupId: 'reactor', start: 7.67, end: 8.17, rate: 9, lastRunHeld: 21,
      schedule: 'Every shift change', cis: 'reactor-bus-*', raisedBy: 'Reactor Core on-call', approvedBy: 'Standing approval',
      reason: 'Load moves between the main buses at every shift change. Output and distribution alarms are expected for a few minutes.',
    },
    {
      id: 'CHG-2280', name: 'Comlink key rotation', groupId: 'holonet', start: 9.67, end: 10, rate: 7, lastRunHeld: 12,
      schedule: 'Daily, 00:00 to 00:20', cis: 'comlink-kms-*', raisedBy: 'ISB key management', approvedBy: 'Standing approval',
      reason: 'Channels reset while the keys rotate. Handshake failures are expected until the rotation finishes.',
    },
    {
      id: 'CHG-2304', name: 'Motivator recalibration', groupId: 'hyperdrive', start: 11.67, end: 13.67, rate: 5, lastRunHeld: 34,
      schedule: 'Tuesdays, 02:00 to 04:00', cis: 'hd-motivator-*', raisedBy: 'Hyperdrive Maintenance', approvedBy: 'Standing approval',
      reason: 'Each motivator is taken offline in turn and recalibrated. Offline and field coil alarms are expected.',
    },
    {
      id: 'CHG-2422', name: 'Detention block door controller upgrade', groupId: 'detention', start: 18.67, end: 20.67, rate: 4,
      schedule: 'One-off', cis: 'aa23-*-door', raisedBy: 'Lieutenant Tanbris', approvedBy: 'Admiral Piett',
      reason: 'Cell doors report open while their controllers restart. Guards are posted for the duration.',
    },
    {
      id: 'CHG-2431', name: 'Tractor beam generator 2 replacement', groupId: 'tractor', start: 29.67, end: 35.67, rate: 6,
      schedule: 'One-off', cis: 'tb-generator-02', raisedBy: 'Chief Bast', approvedBy: 'Grand Moff Tarkin',
      reason: 'Generator 2 is offline for the swap and the other six carry its load, so their coupling temperatures will run high.',
    },
    {
      id: 'CHG-2356', name: 'Atmosphere recycler filter swap', groupId: 'lifesupport', start: 43.67, end: 47.67, rate: 5, lastRunHeld: 29,
      schedule: 'Every fourth week', cis: 'ls-recycler-*', raisedBy: 'Life Support', approvedBy: 'Standing approval',
      reason: 'Recyclers are stopped one at a time while their filters are changed. Pressure drop alarms are expected.',
    },
    {
      id: 'CHG-2317', name: 'Squadron cold-start drills', groupId: 'hangar', start: 62.67, end: 64.67, rate: 8, lastRunHeld: 47,
      schedule: 'Mondays and Thursdays, 05:00', cis: 'hangar-*', raisedBy: 'TIE Hangar Ops', approvedBy: 'Standing approval',
      reason: 'Every squadron launches from cold. Launch rack and magnetic field alarms are expected.',
    },
    // ---------- ended ----------
    {
      id: 'CHG-2405', name: 'Hangar bay 327 magnetic seal service', groupId: 'hangar', start: -7.33, end: -3.83, closed: -3.17, rate: 5,
      schedule: 'One-off', cis: 'hangar-327-*', raisedBy: 'TIE Hangar Ops', approvedBy: 'Admiral Piett',
      reason: 'The seal was powered down for inspection. It closed 40 minutes late, waiting on a replacement emitter.',
    },
    {
      id: 'CHG-2291', name: 'Reactor load rebalance', groupId: 'reactor', start: -8.33, end: -7.83, closed: -7.85, rate: 9,
      schedule: 'Every shift change', cis: 'reactor-bus-*', raisedBy: 'Reactor Core on-call', approvedBy: 'Standing approval',
      reason: 'Load moves between the main buses at every shift change. Output and distribution alarms are expected for a few minutes.',
    },
    {
      id: 'CHG-2280', name: 'Comlink key rotation', groupId: 'holonet', start: -14.33, end: -14, closed: -14.02, rate: 7,
      schedule: 'Daily, 00:00 to 00:20', cis: 'comlink-kms-*', raisedBy: 'ISB key management', approvedBy: 'Standing approval',
      reason: 'Channels reset while the keys rotate. Handshake failures are expected until the rotation finishes.',
    },
    {
      id: 'CHG-2389', name: 'Coolant pump bank A service', groupId: 'reactor', start: -27.33, end: -23.33, closed: -23.6, rate: 6,
      schedule: 'One-off', cis: 'coolant-pump-bank-a', raisedBy: 'Reactor Core on-call', approvedBy: 'Moff Jerjerrod',
      reason: 'Each pump in bank A was stopped and serviced in turn. Flow variance alarms were expected on the others.',
    },
  ] satisfies Draft[]
).map(build);
