/* The access page: who's been let in, and what each of them can see. An admin invites people
 * by their work email and ticks the streams, sub-streams and assignment groups they should
 * see; everything else stays out of their view.
 *
 * This file owns the page's state and wires the pieces together:
 *
 *   Sidebar        navigation (shared with the other pages)
 *   PeopleList     the list column: everyone, searchable by name, email or what they see
 *   PersonPane     the picked person: role, what they see (ScopePicker), history, removal
 *   InvitePane     a new invitation: emails, role, what they'll see
 *   ChangeBar      floats over the pane while there's something to save
 *   AccessPalette  on top when opened
 *
 * Changes are drafts until saved, one per person, so moving about the list loses nothing.
 * Every save, invitation and removal ends in a toast with Undo, because access is the kind
 * of thing people get wrong by one click. */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { PaneToggles } from '../../components/PaneToggles';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';
import { navigate } from '../../lib/route';
import { AccessToast } from './components/common/AccessToast';
import { ChangeBar } from './components/common/ChangeBar';
import { blocks, checkAll } from './components/Invite/EmailField';
import { EMPTY_INVITE, InvitePane, type InviteDraft } from './components/Invite/InvitePane';
import { AccessPalette } from './components/Palette/AccessPalette';
import { PeopleList, type Show } from './components/PeopleList/PeopleList';
import { PersonPane } from './components/PersonPane/PersonPane';
import { ME } from './data/mockData';
import { useAccess } from './hooks/useAccess';
import { findPeople, isDirty, sortPeople, splitEmails } from './model/people';
import { coveredGroups, difference, names, plural } from './model/scopes';
import type { Person } from './model/types';
import './AccessPage.css';

const inShow = (person: Person, show: Show) => show === 'everyone' || (show === 'invited' ? person.status === 'invited' : person.role === 'admin');

export function AccessPage({ initialId }: { /** Open on this person, or "invite" for a new invitation. */ initialId?: string }) {
  const access = useAccess();
  const { people, drafts } = access;
  const [query, setQuery] = useState('');
  const [show, setShow] = useState<Show>('everyone');
  const [selectedId, setSelectedId] = useState<string | null>(initialId && initialId !== 'invite' ? initialId : null);
  const [inviting, setInviting] = useState(initialId === 'invite');
  const [invite, setInvite] = useState<InviteDraft>(EMPTY_INVITE);
  // How the pane's content was asked for: picked with the pointer, it rises in; from the keyboard, it's simply there.
  const [via, setVia] = useState<'key' | 'pointer'>('key');
  const [arrived, setArrived] = useState<Set<string>>(() => new Set());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [hideList, setHideList] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // The search first, so the tabs' counts describe what it found.
  const found = useMemo(() => findPeople(sortPeople(people), query), [people, query]);
  const counts = { everyone: found.length, invited: found.filter((m) => inShow(m.person, 'invited')).length, admins: found.filter((m) => inShow(m.person, 'admins')).length };
  const matches = found.filter((m) => inShow(m.person, show));

  const selected = inviting ? null : (people.find((p) => p.id === selectedId) ?? null);
  const draft = selected ? access.draftOf(selected) : null;
  const dirty = !!selected && isDirty(selected, drafts[selected.id]);
  const edited = new Set(people.filter((p) => isDirty(p, drafts[p.id])).map((p) => p.id));

  // Keep the address in step, without adding a Back step for every J and K.
  useEffect(() => {
    navigate(`#/access${inviting ? '/invite' : selected ? `/${selected.id}` : ''}`, true);
  }, [inviting, selected]);

  // A new person or invitation starts at the top of the pane, with its row in sight in the list.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    rootRef.current?.querySelector('.ac-row[aria-current]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedId, inviting]);

  // An invitation opens with the cursor in the email field.
  useEffect(() => {
    if (inviting) emailRef.current?.focus();
  }, [inviting]);

  const pick = (person: Person, how: 'key' | 'pointer') => {
    setVia(how);
    setInviting(false);
    setSelectedId(person.id);
  };

  /** Move the selection up or down the list. */
  const move = (step: number) => {
    const ids = matches.map((m) => m.person.id);
    const at = ids.indexOf(selected?.id ?? '');
    const next = at < 0 ? ids[step > 0 ? 0 : ids.length - 1] : ids[Math.min(ids.length - 1, Math.max(0, at + step))];
    const person = people.find((p) => p.id === next);
    if (person) pick(person, 'key');
  };

  const startInvite = (how: 'key' | 'pointer') => {
    setVia(how);
    setInviting(true);
  };

  // ---------- the invitation ----------

  // What's typed but not yet a chip counts too: ⌘↵ straight after typing an address sends it.
  const allEmails = [...invite.emails, ...splitEmails(invite.text).filter((e) => !invite.emails.some((x) => x.toLowerCase() === e.toLowerCase()))];
  const checked = checkAll(allEmails, people);
  const sendable = checked.filter((c) => c.check.kind === 'ok').map((c) => c.email);
  const broken = checked.filter((c) => blocks(c.check)).length;
  const readyToSend = sendable.length > 0 && broken === 0 && invite.grants.length > 0;

  const send = () => {
    if (!readyToSend) return;
    const added = access.invite(sendable, { role: invite.role, grants: invite.grants });
    setInvite(EMPTY_INVITE);
    setInviting(false);
    setQuery('');
    if (!added.every((p) => inShow(p, show))) setShow('everyone');
    setArrived(new Set(added.map((p) => p.id)));
    setVia('key');
    setSelectedId(added[0]!.id);
    toast.custom((id) => (
      <AccessToast
        title={added.length === 1 ? `Invitation sent to ${added[0]!.email}` : `Invitations sent to ${added.length} people`}
        sub="They show as signed in once they accept"
        onUndo={() => {
          access.withdraw(added);
          setSelectedId(null);
          toast.dismiss(id);
        }}
      />
    ));
  };

  const inviteNote: ReactNode =
    !allEmails.length ? (
      'Add a work email to invite someone.'
    ) : broken ? (
      <>Fix or remove {broken === 1 ? 'the address' : `${broken} addresses`} marked in red to send.</>
    ) : !sendable.length ? (
      'Everyone in the list already has access.'
    ) : !invite.grants.length ? (
      <>Tick what {sendable.length === 1 ? 'they' : `these ${sendable.length} people`} should see.</>
    ) : (
      <>
        Invite <strong>{plural(sendable.length, 'person', 'people')}</strong>
        {invite.role === 'admin' ? ' as admins' : ''}, to see <strong>{plural(coveredGroups(invite.grants).size, 'assignment group')}</strong>.
      </>
    );

  // ---------- a person ----------

  const saveSelected = () => {
    if (!selected || !dirty) return;
    const person = selected;
    const saved = access.save(person);
    if (!saved) return;
    toast.custom((id) => (
      <AccessToast
        title={`${person.name}’s access saved`}
        sub={saved.text}
        onUndo={() => {
          saved.undo();
          toast.dismiss(id);
        }}
      />
    ));
  };

  const removeSelected = () => {
    if (!selected || selected.id === ME) return;
    const person = selected;
    const ids = matches.map((m) => m.person.id);
    const at = ids.indexOf(person.id);
    const restore = access.remove(person);
    setSelectedId(ids[at + 1] ?? ids[at - 1] ?? null);
    toast.custom((id) => (
      <AccessToast
        title={person.status === 'invited' ? `Invitation to ${person.email} withdrawn` : `${person.name}’s access removed`}
        sub={person.status === 'invited' ? 'Their link no longer works' : 'They’ve been signed out'}
        onUndo={() => {
          restore();
          setSelectedId(person.id);
          toast.dismiss(id);
        }}
      />
    ));
  };

  const resend = (person: Person) =>
    toast.custom(() => <AccessToast title={`Invitation sent again to ${person.email}`} sub="The link in the earlier email stops working" />);

  const changeNote = selected && draft ? <ChangeNote before={selected} after={draft} /> : null;

  useKeyboardShortcuts({
    tourOpen: false,
    paletteOpen,
    onTogglePalette: () => setPaletteOpen((open) => !open),
    onSubmit: inviting ? send : dirty ? saveSelected : undefined,
    keys: {
      j: () => move(1),
      ArrowDown: () => move(1),
      k: () => move(-1),
      ArrowUp: () => move(-1),
      '/': () => searchRef.current?.focus(),
      n: () => startInvite('key'),
      '[': () => setHideSide((hidden) => !hidden),
      ']': () => setHideList((hidden) => !hidden),
      // Esc steps back: out of the invitation (its draft stays), or puts the person away.
      ...(inviting ? { Escape: () => setInviting(false) } : selected ? { Escape: () => setSelectedId(null) } : {}),
    },
  });

  const invitedCount = people.filter((p) => p.status === 'invited').length;
  const bar = inviting || dirty;

  return (
    <div className="mn ac" ref={rootRef} data-hide-side={hideSide || undefined} data-hide-list={hideList || undefined}>
      <Sidebar hidden={hideSide} page="access" onOpenPalette={() => setPaletteOpen(true)} theme={theme} onToggleTheme={toggleTheme} />

      <PeopleList
        hidden={hideList}
        matches={matches}
        counts={counts}
        show={show}
        onShow={setShow}
        selectedId={selected?.id ?? null}
        inviting={inviting}
        edited={edited}
        arrived={arrived}
        onPick={(person) => pick(person, 'pointer')}
        onInvite={startInvite}
        query={query}
        onQuery={setQuery}
        searchRef={searchRef}
      />

      <section className="mn-detail ac-pane">
        <div className="ac-top">
          <PaneToggles
            hideSide={hideSide}
            hideList={hideList}
            onToggleSide={() => setHideSide((hidden) => !hidden)}
            onToggleList={() => setHideList((hidden) => !hidden)}
            listLabel="People list"
          />
          <span className="ac-top-note mn-truncate">
            {plural(people.length - invitedCount, 'person', 'people')} signed in
            {invitedCount > 0 && <> · {plural(invitedCount, 'invitation')} waiting</>}
          </span>
        </div>

        <div className="ac-scroll" ref={scrollRef} data-bar={bar || undefined}>
          {inviting ? (
            <InvitePane
              draft={invite}
              onDraft={(patch) => setInvite((d) => ({ ...d, ...patch }))}
              people={people}
              onOpen={(person) => pick(person, 'pointer')}
              emailRef={emailRef}
              animate={via === 'pointer'}
            />
          ) : selected && draft ? (
            <PersonPane
              key={selected.id}
              person={selected}
              draft={draft}
              onEdit={(patch) => access.edit(selected, patch)}
              others={people.filter((p) => p.id !== selected.id)}
              isMe={selected.id === ME}
              onResend={() => resend(selected)}
              onRemove={removeSelected}
              animate={via === 'pointer'}
            />
          ) : (
            <div className="ac-blank">
              <p>Pick someone to see what they can access, and change it.</p>
              <button className="mn-btn" data-variant="primary" onClick={(e) => startInvite(e.detail > 0 ? 'pointer' : 'key')}>
                <UserPlus size={15} />
                Invite people
                <kbd>N</kbd>
              </button>
            </div>
          )}
        </div>

        {inviting ? (
          <ChangeBar
            cancel="Discard"
            onCancel={() => {
              setInvite(EMPTY_INVITE);
              setInviting(false);
            }}
            submit={sendable.length > 1 ? `Send ${sendable.length} invitations` : 'Send invitation'}
            onSubmit={send}
            ready={readyToSend}
          >
            {inviteNote}
          </ChangeBar>
        ) : (
          dirty &&
          selected && (
            <ChangeBar cancel="Discard" onCancel={() => access.discard(selected.id)} submit="Save changes" onSubmit={saveSelected} ready>
              {changeNote}
            </ChangeBar>
          )
        )}
      </section>

      <AccessPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        people={sortPeople(people)}
        onSelect={(person) => pick(person, 'key')}
        onInvite={() => startInvite('key')}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}

/** What saving would do, in one sentence: "Adds Superlaser; removes Reactor Core and 2 more." */
function ChangeNote({ before, after }: { before: Person; after: { role: Person['role']; grants: string[] } }) {
  const { added, removed } = difference(before.grants, after.grants);
  const parts: { verb: string; what?: string }[] = [];
  if (after.role !== before.role) parts.push({ verb: after.role === 'admin' ? 'makes them an admin' : 'makes them a member' });
  if (added.length) parts.push({ verb: 'adds', what: names(added) });
  if (removed.length) parts.push({ verb: 'removes', what: names(removed) });
  return (
    <>
      {parts.map(({ verb, what }, i) => (
        <span key={verb}>
          {i ? '; ' : ''}
          {i ? verb : verb[0]!.toUpperCase() + verb.slice(1)}
          {what && (
            <>
              {' '}
              <strong>{what}</strong>
            </>
          )}
        </span>
      ))}
      .
    </>
  );
}
