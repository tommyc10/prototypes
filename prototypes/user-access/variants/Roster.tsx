import { useState } from 'react';
import { ArrowDown, ArrowUpRight, ShieldCheck, Users } from 'lucide-react';
import type { Access, Member } from '../model';
import { ActivityFeed, AccessEditor, AccessGuide, Avatar, EditArrow, Empty, InviteButton, Metrics, PageHeading, ScopeChips, SearchField, Status } from '../shared';

export default function Roster({ access }: { access: Access }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All people');
  const [selected, setSelected] = useState<Member | null | undefined>();
  const [animate, setAnimate] = useState(false);
  const [ascending, setAscending] = useState(false);
  const people = access.members.filter(m => (m.name + m.email).toLowerCase().includes(query.toLowerCase()) && (filter === 'All people' || (filter === 'Admins' ? m.role === 'Admin' : m.status === 'Invited')));
  if (ascending) people.sort((a, b) => a.name.localeCompare(b.name));
  function invite(motion: boolean) { setAnimate(motion); setSelected(null); }
  return <main className="mn-ua-page" data-layout="roster">
    <PageHeading><InviteButton quiet={selected !== undefined} onClick={invite} /></PageHeading>
    {selected === undefined && <Metrics access={access} />}
    <div className="mn-ua-roster-body" data-editing={selected !== undefined || undefined}>
      <div className="mn-ua-roster-main">{selected !== undefined && <Metrics access={access} />}<div className="mn-ua-table-tools"><div className="mn-tabs">{['All people', 'Admins', 'Invited'].map(f => <button key={f} className="mn-tab" data-active={filter === f || undefined} onClick={() => setFilter(f)}>{f}<span>{access.members.filter(m => f === 'All people' || (f === 'Admins' ? m.role === 'Admin' : m.status === 'Invited')).length}</span></button>)}</div><SearchField value={query} onChange={setQuery} /></div>
        <div className="mn-ua-table-wrap"><table className="mn-ua-table"><thead><tr><th><button onClick={() => setAscending(v => !v)}>Person<ArrowDown size={12} data-flipped={ascending || undefined} /></button></th><th>Role</th><th>Access</th><th>Status</th><th><span className="mn-sr">Manage</span></th></tr></thead><tbody>{people.map(m => <tr key={m.id} data-selected={selected?.id === m.id || undefined}><td><button className="mn-ua-table-person" onClick={e => { setAnimate(e.detail > 0); setSelected(m); }}><Avatar member={m} /><span><strong>{m.name}{m.id === 'piett' && <small>You</small>}</strong><small>{m.email}</small></span></button></td><td><span className="mn-ua-role-label">{m.role === 'Admin' && <ShieldCheck size={12} />}{m.role}</span></td><td><ScopeChips leaves={m.leaves} /></td><td><Status status={m.status} /></td><td><button className="mn-icon-btn" aria-label={'Manage ' + m.name} onClick={e => { setAnimate(e.detail > 0); setSelected(m); }}><EditArrow /></button></td></tr>)}</tbody></table>{!people.length && <Empty />}</div>
        <div className="mn-ua-table-foot"><span><Users size={12} />{people.length} of {access.members.length} people</span><span>Only invited people can join <ShieldCheck size={12} /></span></div>
        <ActivityFeed access={access} />
        <div className="mn-ua-bottom-note"><LockNote /><span><kbd>N</kbd> invite <kbd>/</kbd> search <kbd>Esc</kbd> close</span></div>
      </div>
      {selected !== undefined && <AccessEditor key={selected?.id ?? 'invite'} access={access} member={selected} onClose={() => setSelected(undefined)} animate={animate} />}
      {selected === undefined && <aside className="mn-ua-roster-guide"><div className="mn-ua-section-title"><h2>Built on trust.</h2><ArrowUpRight size={15} /></div><p>Keep your operation open to the right people, with boundaries that make sense.</p><AccessGuide /><div className="mn-ua-quiet-stat"><strong>{access.members.filter(m => m.role === 'Admin').length}</strong><span>admins looking after<br />this workspace</span></div></aside>}
    </div>
  </main>;
}
function LockNote() { return <span><ShieldCheck size={12} />Access is invite-only</span>; }
