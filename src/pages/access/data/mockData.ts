/* Mock data: the streams, sub-streams and assignment groups, and the people who've been let
 * in. In the real app, the tree comes from the org structure and the people from the access
 * service; the page only ever sees these shapes (model/types.ts). */

import type { Person, Scope, ScopeKind } from '../model/types';

/** Only addresses at this domain can be invited. */
export const WORK_DOMAIN = 'imperial.navy';

/** The signed-in admin. They can't change their own access, so they can't lock themselves out. */
export const ME = 'piett';

const slug = (name: string) => name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** A branch of the tree; its id is its path, so `ds/power/reactor-core` reads as where it sits. */
function scope(kind: ScopeKind, name: string, parent: string, children: (path: string) => Scope[] = () => []): Scope {
  const id = parent ? `${parent}/${slug(name)}` : slug(name);
  return { id, name, kind, children: children(id) };
}

const groups = (...names: string[]) => (parent: string) => names.map((name) => scope('group', name, parent));

export const STREAMS: Scope[] = [
  scope('stream', 'Death Star Operations', '', (ds) => [
    scope('substream', 'Power & propulsion', ds, groups('Reactor Core', 'Tractor Beam Ops', 'Hypermatter Supply', 'Coolant Systems')),
    scope('substream', 'Station services', ds, groups('Facilities', 'Life Support', 'Turbolift Maintenance', 'Waste Management')),
    scope('substream', 'Superlaser', ds, groups('Superlaser Targeting', 'Kyber Crystal Handling', 'Firing Control')),
  ]),
  scope('stream', 'Imperial Navy', '', (navy) => [
    scope('substream', 'Flight operations', navy, groups('TIE Hangar Ops', 'Flight Control', 'Pilot Readiness')),
    scope('substream', 'Fleet logistics', navy, groups('Fleet Supply', 'Shipyard Liaison', 'Fuel Depots', 'Spare Parts')),
    scope('substream', 'Hyperdrive', navy, groups('Hyperdrive Maintenance', 'Navicomputer Support')),
  ]),
  scope('stream', 'Imperial Security Bureau', '', (isb) => [
    scope('substream', 'Communications', isb, groups('HoloNet Comms', 'Comlink Encryption', 'Relay Network')),
    scope('substream', 'Intelligence', isb, groups('Probe Droid Network', 'Signals Analysis')),
    scope('substream', 'Detention', isb, groups('Detention Block AA-23', 'Prisoner Transfer')),
  ]),
  scope('stream', 'Stormtrooper Corps', '', (corps) => [
    scope('substream', 'Security', corps, groups('Base Security', 'Patrol Scheduling')),
    scope('substream', 'Armoury', corps, groups('Armory & Logistics', 'Armour Fitting', 'Weapons Calibration')),
    scope('substream', 'Training', corps, groups('Academy Systems')),
  ]),
];

const day = (d: number, h = 0) => new Date(Date.UTC(2026, 8, 28 - d, 14 - h, 20)).toISOString();

export const PEOPLE: Person[] = [
  {
    id: 'piett',
    name: 'Admiral Piett',
    email: 'f.piett@imperial.navy',
    role: 'admin',
    status: 'active',
    grants: ['death-star-operations', 'imperial-navy', 'imperial-security-bureau', 'stormtrooper-corps'],
    invitedAt: day(410),
    lastSeen: day(0),
    history: [{ at: day(410), by: 'Grand Moff Tarkin', text: 'Invited as an admin, to every stream' }],
  },
  {
    id: 'veers',
    name: 'General Veers',
    email: 'm.veers@imperial.navy',
    role: 'admin',
    status: 'active',
    grants: ['stormtrooper-corps', 'imperial-navy/flight-operations'],
    invitedAt: day(300),
    lastSeen: day(0, 3),
    history: [
      { at: day(40), by: 'Admiral Piett', text: 'Made an admin' },
      { at: day(300), by: 'Admiral Piett', text: 'Invited to Stormtrooper Corps and Flight operations' },
    ],
  },
  {
    id: 'ozzel',
    name: 'Admiral Ozzel',
    email: 'k.ozzel@imperial.navy',
    role: 'member',
    status: 'active',
    grants: ['imperial-navy/hyperdrive', 'imperial-navy/fleet-logistics/fuel-depots'],
    invitedAt: day(220),
    lastSeen: day(6),
    history: [
      { at: day(12), by: 'Admiral Piett', text: 'Removed Flight operations' },
      { at: day(220), by: 'Admiral Piett', text: 'Invited to Imperial Navy' },
    ],
  },
  {
    id: 'motti',
    name: 'Admiral Motti',
    email: 'c.motti@imperial.navy',
    role: 'member',
    status: 'active',
    grants: ['death-star-operations/superlaser', 'death-star-operations/power-and-propulsion/reactor-core'],
    invitedAt: day(180),
    lastSeen: day(1),
    history: [{ at: day(180), by: 'Admiral Piett', text: 'Invited to Superlaser and Reactor Core' }],
  },
  {
    id: 'tagge',
    name: 'General Tagge',
    email: 'c.tagge@imperial.navy',
    role: 'member',
    status: 'active',
    grants: ['death-star-operations'],
    invitedAt: day(176),
    lastSeen: day(0, 6),
    history: [{ at: day(176), by: 'Admiral Piett', text: 'Invited to Death Star Operations' }],
  },
  {
    id: 'thrawn',
    name: 'Grand Admiral Thrawn',
    email: 'thrawn@imperial.navy',
    role: 'member',
    status: 'active',
    grants: ['imperial-security-bureau/intelligence', 'imperial-security-bureau/communications/holonet-comms', 'imperial-navy/fleet-logistics'],
    invitedAt: day(90),
    lastSeen: day(0, 1),
    history: [
      { at: day(30), by: 'General Veers', text: 'Added Fleet logistics' },
      { at: day(90), by: 'Admiral Piett', text: 'Invited to Intelligence and HoloNet Comms' },
    ],
  },
  {
    id: 'pryce',
    name: 'Governor Pryce',
    email: 'a.pryce@imperial.navy',
    role: 'member',
    status: 'active',
    grants: ['imperial-navy/fleet-logistics/shipyard-liaison', 'imperial-navy/fleet-logistics/fleet-supply'],
    invitedAt: day(140),
    lastSeen: day(3),
    history: [{ at: day(140), by: 'Admiral Piett', text: 'Invited to Shipyard Liaison and Fleet Supply' }],
  },
  {
    id: 'krennic',
    name: 'Director Krennic',
    email: 'o.krennic@imperial.navy',
    role: 'member',
    status: 'active',
    grants: ['death-star-operations/superlaser/kyber-crystal-handling', 'death-star-operations/superlaser/firing-control'],
    invitedAt: day(260),
    lastSeen: day(21),
    history: [
      { at: day(25), by: 'Admiral Piett', text: 'Removed Superlaser Targeting' },
      { at: day(260), by: 'Admiral Piett', text: 'Invited to Superlaser' },
    ],
  },
  {
    id: 'erso',
    name: 'G. Erso',
    email: 'g.erso@imperial.navy',
    role: 'member',
    status: 'invited',
    grants: ['death-star-operations/superlaser/kyber-crystal-handling'],
    invitedAt: day(2),
    history: [{ at: day(2), by: 'Director Krennic', text: 'Invited to Kyber Crystal Handling' }],
  },
  {
    id: 'pellaeon',
    name: 'Captain Pellaeon',
    email: 'g.pellaeon@imperial.navy',
    role: 'member',
    status: 'active',
    grants: ['imperial-navy/flight-operations', 'imperial-navy/hyperdrive'],
    invitedAt: day(70),
    lastSeen: day(0, 2),
    history: [{ at: day(70), by: 'General Veers', text: 'Invited to Flight operations and Hyperdrive' }],
  },
  {
    id: 'vanto',
    name: 'E. Vanto',
    email: 'e.vanto@imperial.navy',
    role: 'member',
    status: 'invited',
    grants: ['imperial-security-bureau/intelligence/signals-analysis'],
    invitedAt: day(0, 4),
    history: [{ at: day(0, 4), by: 'Grand Admiral Thrawn', text: 'Invited to Signals Analysis' }],
  },
  {
    id: 'ree',
    name: 'Captain Ree',
    email: 'c.ree@imperial.navy',
    role: 'member',
    status: 'active',
    grants: ['imperial-navy/flight-operations/tie-hangar-ops', 'imperial-navy/flight-operations/pilot-readiness'],
    invitedAt: day(60),
    lastSeen: day(0, 5),
    history: [{ at: day(60), by: 'General Veers', text: 'Invited to TIE Hangar Ops and Pilot Readiness' }],
  },
  {
    id: 'sloane',
    name: 'Admiral Sloane',
    email: 'r.sloane@imperial.navy',
    role: 'member',
    status: 'active',
    grants: ['imperial-security-bureau/detention', 'stormtrooper-corps/security'],
    invitedAt: day(120),
    lastSeen: day(2),
    history: [{ at: day(120), by: 'Admiral Piett', text: 'Invited to Detention and Security' }],
  },
  {
    id: 'hux',
    name: 'B. Hux',
    email: 'b.hux@imperial.navy',
    role: 'member',
    status: 'invited',
    grants: ['stormtrooper-corps/training'],
    invitedAt: day(9),
    history: [{ at: day(9), by: 'General Veers', text: 'Invited to Training' }],
  },
  {
    id: 'konstantine',
    name: 'Admiral Kassius Konstantine of the Seventh Fleet',
    email: 'kassius.konstantine.seventh-fleet@imperial.navy',
    role: 'member',
    status: 'active',
    grants: [],
    invitedAt: day(200),
    lastSeen: day(64),
    history: [
      { at: day(15), by: 'Admiral Piett', text: 'Removed Fleet logistics' },
      { at: day(200), by: 'Admiral Piett', text: 'Invited to Fleet logistics' },
    ],
  },
];
