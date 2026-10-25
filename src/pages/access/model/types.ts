/* The shape of the data. A person is let in by their work email and sees only the parts of
 * the operation an admin has ticked for them.
 *
 * The parts form one tree: a stream holds sub-streams, a sub-stream holds assignment groups.
 * Access is given at any level. Ticking a stream or a sub-stream gives the whole of it, so
 * whatever is added to it later is included too; ticking assignment groups one by one gives
 * just those. */

export type ScopeKind = 'stream' | 'substream' | 'group';

export interface Scope {
  id: string;
  name: string;
  kind: ScopeKind;
  /** Empty for an assignment group. */
  children: Scope[];
}

export type Role = 'member' | 'admin';

/** Invited: the email has gone, and they haven't signed in yet. */
export type PersonStatus = 'active' | 'invited';

/** One change to a person's access, for their history. */
export interface Change {
  at: string;
  by: string;
  text: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: PersonStatus;
  /** What they've been given: the ids of streams, sub-streams and assignment groups.
   *  Never an id whose stream or sub-stream is also here (see model/scopes.ts). */
  grants: string[];
  /** When they were invited. */
  invitedAt: string;
  /** When they last signed in. Invited people haven't yet. */
  lastSeen?: string;
  /** Newest first. */
  history: Change[];
}

/** A change to someone's access that hasn't been saved yet. */
export interface Draft {
  role: Role;
  grants: string[];
}
