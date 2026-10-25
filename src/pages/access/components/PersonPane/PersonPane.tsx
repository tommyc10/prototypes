/* One person: who they are, their role, what they can see (the picker, changed in place),
 * what's changed before, and the way to take their access away.
 *
 * There's no edit mode. Ticking anything starts a draft, which the change bar saves; the
 * sentence at the top follows the ticks as they change, so it always says what they'd see. */

import { ago } from '../../../../lib/format';
import { STREAMS } from '../../data/mockData';
import { initials } from '../../model/people';
import { coveredGroups, groupsIn, plural, ALL_GROUPS } from '../../model/scopes';
import type { Draft, Person } from '../../model/types';
import { RoleControl } from '../common/RoleControl';
import { ScopePicker } from '../ScopePicker/ScopePicker';

export function PersonPane({
  person,
  draft,
  onEdit,
  others,
  isMe,
  onResend,
  onRemove,
  animate,
}: {
  person: Person;
  draft: Draft;
  onEdit: (patch: Partial<Draft>) => void;
  /** Everyone else, whose access can be copied. */
  others: Person[];
  /** The signed-in admin, who can't change their own access. */
  isMe: boolean;
  onResend: () => void;
  onRemove: () => void;
  /** Picked with the pointer: rise in. From the keyboard: simply there. */
  animate: boolean;
}) {
  const invited = person.status === 'invited';
  return (
    <div className="ac-doc" data-animate={animate || undefined}>
      <header className="ac-head">
        <span className="mn-avatar ac-head-avatar" data-invited={invited || undefined} aria-hidden>
          {initials(person.name)}
        </span>
        <div className="ac-head-text">
          <h2 className="ac-title">{person.name}</h2>
          <div className="ac-head-meta">
            <span className="mn-truncate">{person.email}</span>
            <span className="ac-sep" />
            {invited ? (
              <>
                <span className="ac-status">
                  <span className="mn-dot" data-status="proposed" />
                  Invited {ago(person.invitedAt)}, not signed in yet
                </span>
                <button type="button" className="mn-link ac-resend" onClick={onResend}>
                  Send again
                </button>
              </>
            ) : (
              <span className="ac-status">
                <span className="mn-dot" data-status="active" />
                Signed in {ago(person.lastSeen!)}
              </span>
            )}
          </div>
        </div>
      </header>

      <Summary person={person} draft={draft} />

      {isMe && <p className="ac-note">This is you. Another admin can change your access, so nobody can lock themselves out.</p>}

      <section className="ac-sec">
        <h3>Role</h3>
        <RoleControl role={draft.role} onRole={(role) => onEdit({ role })} disabled={isMe} />
      </section>

      <section className="ac-sec">
        <h3>
          What they can see
          <span className="mn-subtle">Tick a stream, a sub-stream or single assignment groups</span>
        </h3>
        <ScopePicker key={person.id} grants={draft.grants} saved={person.grants} onChange={(grants) => onEdit({ grants })} people={others} disabled={isMe} />
      </section>

      <section className="ac-sec">
        <h3>History</h3>
        <ol className="ac-history">
          {person.history.map((change, i) => (
            <li key={i}>
              <span>{change.text}</span>
              <span className="mn-subtle">
                {change.by} · {ago(change.at)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {!isMe && (
        <section className="ac-sec ac-remove">
          <h3>{invited ? 'Withdraw the invitation' : 'Remove access'}</h3>
          <p className="ac-p">
            {invited
              ? 'The link in their email stops working. You can undo this straight after.'
              : 'They’re signed out at once and lose everything above. You can undo this straight after.'}
          </p>
          <button type="button" className="mn-btn" data-variant="danger" onClick={onRemove}>
            {invited ? 'Withdraw invitation' : 'Remove access'}
          </button>
        </section>
      )}
    </div>
  );
}

/** The sentence under the name: what they see, as the ticks now stand. */
function Summary({ person, draft }: { person: Person; draft: Draft }) {
  const covered = coveredGroups(draft.grants);
  const streams = STREAMS.filter((s) => groupsIn(s).some((g) => covered.has(g.id))).length;
  const will = person.status === 'invited';
  if (!covered.size) return <p className="ac-lead">{will ? 'Will see nothing once they sign in.' : 'Sees nothing.'} Tick what they should see below.</p>;
  return (
    <p className="ac-lead">
      {will ? 'Will see ' : 'Sees '}
      <strong>{covered.size}</strong> of {plural(ALL_GROUPS.length, 'assignment group')}, in <strong>{plural(streams, 'stream')}</strong>
      {will ? ', once they sign in.' : '.'}
    </p>
  );
}
