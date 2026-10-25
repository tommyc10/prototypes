/* People: who matches a search, what an email address says about who it is, and what a
 * change to someone's access amounts to, in words. */

import { WORK_DOMAIN } from '../data/mockData';
import { difference, names, nameMatches, searchTree, tickOf } from './scopes';
import type { Draft, Person, Role } from './types';

export const ROLE_LABEL: Record<Role, string> = { member: 'Member', admin: 'Admin' };

/** "Admiral Piett" → "AP", "G. Erso" → "GE" */
export const initials = (name: string) =>
  name
    .split(/[\s.]+/)
    .filter(Boolean)
    .filter((_, i, all) => i === 0 || i === all.length - 1)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** What to call someone who hasn't signed in yet: "g.erso@…" → "G. Erso", "thrawn@…" → "Thrawn". */
export function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  return parts.map((p, i) => (p.length === 1 && i < parts.length - 1 ? `${p.toUpperCase()}.` : p[0]!.toUpperCase() + p.slice(1))).join(' ');
}

export type EmailCheck =
  | { kind: 'ok' }
  | { kind: 'malformed' }
  | { kind: 'outside' }
  | { kind: 'member'; person: Person }
  | { kind: 'repeat' };

const SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Whether an address can be invited, and if not, why. `earlier` is what's already in the field. */
export function checkEmail(email: string, people: Person[], earlier: string[]): EmailCheck {
  const address = email.toLowerCase();
  if (!SHAPE.test(address)) return { kind: 'malformed' };
  if (!address.endsWith(`@${WORK_DOMAIN}`)) return { kind: 'outside' };
  const person = people.find((p) => p.email.toLowerCase() === address);
  if (person) return { kind: 'member', person };
  if (earlier.some((e) => e.toLowerCase() === address)) return { kind: 'repeat' };
  return { kind: 'ok' };
}

/** Pasted lists come separated by commas, semicolons, spaces or new lines, sometimes as "Name <address>". */
export const splitEmails = (text: string) =>
  text
    .split(/[\s,;]+/)
    .map((t) => t.replace(/^<|>$/g, '').trim())
    .filter((t) => t.includes('@'));

export interface Match {
  person: Person;
  /** When the search found them by something they can see, not by who they are. */
  via?: string;
}

/** Whoever the search names, by name or email, and whoever can see a stream, sub-stream or
 *  group it names: "reactor" finds everyone who can see Reactor Core. */
export function findPeople(people: Person[], query: string): Match[] {
  if (!query.trim()) return people.map((person) => ({ person }));
  const { hits } = searchTree(query);
  const out: Match[] = [];
  for (const person of people) {
    if (nameMatches(`${person.name} ${person.email}`, query)) {
      out.push({ person });
      continue;
    }
    // The biggest part the search names that they see the whole of, else the first they see some of.
    const whole = hits.find((s) => tickOf(s, person.grants) === 'on');
    const part = hits.find((s) => tickOf(s, person.grants) === 'mixed');
    if (whole) out.push({ person, via: whole.name });
    else if (part) out.push({ person, via: `part of ${part.name}` });
  }
  return out;
}

/** Has anything in the draft changed from what's saved? */
export const isDirty = (person: Person, draft?: Draft) =>
  !!draft && (draft.role !== person.role || draft.grants.join() !== person.grants.join());

/** A change, in words, for their history: "Added Superlaser; removed Reactor Core". */
export function describeChange(person: Person, draft: Draft) {
  const { added, removed } = difference(person.grants, draft.grants);
  const parts: string[] = [];
  if (draft.role !== person.role) parts.push(draft.role === 'admin' ? 'Made an admin' : 'Made a member');
  if (added.length) parts.push(`${parts.length ? 'added' : 'Added'} ${names(added)}`);
  if (removed.length) parts.push(`${parts.length ? 'removed' : 'Removed'} ${names(removed)}`);
  return parts.join('; ');
}

/** The people a list shows, in order: by name, with whoever hasn't accepted yet last. */
export const sortPeople = (people: Person[]) =>
  [...people].sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name, 'en-GB') : a.status === 'active' ? -1 : 1));
