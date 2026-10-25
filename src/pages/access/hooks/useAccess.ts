/* The people, and the changes to them not saved yet.
 *
 * A change you're making to someone stays theirs while you look at someone else: each person
 * keeps their own draft until it's saved or discarded, so J and K never throw work away.
 *
 * In the real app, each of these calls the access service and the list refreshes from it. */

import { useState } from 'react';
import { NOW } from '../../../lib/clock';
import { PEOPLE } from '../data/mockData';
import { describeChange, nameFromEmail } from '../model/people';
import { names, scopeById } from '../model/scopes';
import type { Draft, Person } from '../model/types';

/** Who's signed in, for the history. */
const ADMIN = 'Admiral Piett';

export function useAccess() {
  const [people, setPeople] = useState<Person[]>(PEOPLE);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const draftOf = (person: Person): Draft => drafts[person.id] ?? { role: person.role, grants: person.grants };

  const edit = (person: Person, patch: Partial<Draft>) => setDrafts((all) => ({ ...all, [person.id]: { ...draftOf(person), ...patch } }));

  const discard = (id: string) =>
    setDrafts(({ [id]: _, ...rest }) => rest);

  /** Save someone's draft. Returns what changed, in words, and how to put it back. */
  const save = (person: Person) => {
    const draft = drafts[person.id];
    if (!draft) return null;
    const text = describeChange(person, draft);
    const change = { at: NOW.toISOString(), by: ADMIN, text };
    setPeople((all) => all.map((p) => (p.id === person.id ? { ...p, ...draft, history: [change, ...p.history] } : p)));
    discard(person.id);
    return { text, undo: () => setPeople((all) => all.map((p) => (p.id === person.id ? person : p))) };
  };

  /** Send invitations; returns the new people, so the page can open the first. */
  const invite = (emails: string[], draft: Draft): Person[] => {
    const at = NOW.toISOString();
    const text = `Invited${draft.role === 'admin' ? ' as an admin' : ''} to ${names(draft.grants.map((id) => scopeById(id)!))}`;
    const added = emails.map<Person>((email) => ({
      id: email.toLowerCase(),
      name: nameFromEmail(email),
      email: email.toLowerCase(),
      role: draft.role,
      status: 'invited',
      grants: draft.grants,
      invitedAt: at,
      history: [{ at, by: ADMIN, text }],
    }));
    setPeople((all) => [...all, ...added]);
    return added;
  };

  /** Take away someone's access (or withdraw their invitation). Returns how to put it back. */
  const remove = (person: Person) => {
    const at = people.indexOf(person);
    setPeople((all) => all.filter((p) => p.id !== person.id));
    discard(person.id);
    return () => setPeople((all) => (all.some((p) => p.id === person.id) ? all : [...all.slice(0, at), person, ...all.slice(at)]));
  };

  const withdraw = (added: Person[]) => setPeople((all) => all.filter((p) => !added.includes(p)));

  return { people, drafts, draftOf, edit, discard, save, invite, remove, withdraw };
}

export type Access = ReturnType<typeof useAccess>;
