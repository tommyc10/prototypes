/* A new invitation: who (work emails), as what (member or admin), to see what (the picker).
 * Several people can be invited at once, to the same access: paste the list.
 *
 * The draft stays when the pane is left (Esc, or picking someone in the list), so looking
 * something up mid-invitation loses nothing; N brings it back. */

import type { RefObject } from 'react';
import type { Person, Role } from '../../model/types';
import { RoleControl } from '../common/RoleControl';
import { ScopePicker } from '../ScopePicker/ScopePicker';
import { EmailField } from './EmailField';

export interface InviteDraft {
  emails: string[];
  /** Typed into the email field, not yet a chip. */
  text: string;
  role: Role;
  grants: string[];
}

export const EMPTY_INVITE: InviteDraft = { emails: [], text: '', role: 'member', grants: [] };

export function InvitePane({
  draft,
  onDraft,
  people,
  onOpen,
  emailRef,
  animate,
}: {
  draft: InviteDraft;
  onDraft: (patch: Partial<InviteDraft>) => void;
  people: Person[];
  onOpen: (person: Person) => void;
  emailRef: RefObject<HTMLInputElement | null>;
  animate: boolean;
}) {
  return (
    <div className="ac-doc" data-animate={animate || undefined}>
      <header>
        <h2 className="ac-title">Invite people</h2>
        <p className="ac-lead">They get an email with a link to sign in, and see only what you tick below. Paste a list to invite several people to the same things.</p>
      </header>

      <section className="ac-sec">
        <h3>Work email</h3>
        <EmailField emails={draft.emails} text={draft.text} onChange={(emails, text) => onDraft({ emails, text })} people={people} onOpen={onOpen} inputRef={emailRef} />
      </section>

      <section className="ac-sec">
        <h3>Role</h3>
        <RoleControl role={draft.role} onRole={(role) => onDraft({ role })} />
      </section>

      <section className="ac-sec">
        <h3>
          What they can see
          <span className="mn-subtle">Tick a stream, a sub-stream or single assignment groups</span>
        </h3>
        <ScopePicker grants={draft.grants} onChange={(grants) => onDraft({ grants })} people={people} />
      </section>
    </div>
  );
}
