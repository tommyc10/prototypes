import { useState } from 'react';
import { Mail, ShieldCheck, Users } from 'lucide-react';
import type { Access, Member } from '../model';
import { AccessEditor, AccessGuide, Empty, InviteButton, PersonButton, SearchField, Welcome } from '../shared';

export default function Directory({ access }: { access: Access }) {
  const [selected, setSelected] = useState<Member | null | undefined>(access.members.find(m => m.id === 'tanbris'));
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('Everyone');
  const [animate, setAnimate] = useState(false);
  function invite(motion: boolean) { setSelected(null); setAnimate(motion); }
  const people = access.members.filter(m => (m.name + m.email).toLowerCase().includes(query.toLowerCase()) && (tab === 'Everyone' || m.status === 'Invited'));
  return <main className="mn-ua-directory">
    <aside className="mn-ua-directory-list"><header><div className="mn-ua-eyebrow"><ShieldCheck size={13} />Workspace administration</div><h1>People & access<span>{access.members.length}</span></h1><p>A crew with clear boundaries.</p><SearchField value={query} onChange={setQuery} /><div className="mn-ua-directory-tools"><div className="mn-tabs">{['Everyone', 'Invited'].map(t => <button key={t} className="mn-tab" data-active={t === tab || undefined} onClick={() => setTab(t)}>{t}</button>)}</div><span>{people.length}</span></div></header>
      <div className="mn-ua-directory-people">{people.map(m => <PersonButton key={m.id} member={m} selected={selected?.id === m.id} onClick={motion => { setSelected(m); setAnimate(motion); }} />)}{!people.length && <Empty />}</div>
      <footer><InviteButton quiet onClick={invite} /><div><kbd>N</kbd> invite <kbd>/</kbd> search</div></footer>
    </aside>
    <section className="mn-ua-directory-detail">
      <div className="mn-ua-directory-context"><span><Users size={14} />{selected ? selected.name : selected === null ? 'New invitation' : 'Workspace directory'}</span><span><ShieldCheck size={12} />Invite-only workspace</span></div>
      {selected !== undefined ? <AccessEditor key={selected?.id ?? 'invite'} access={access} member={selected} onClose={() => setSelected(undefined)} animate={animate} wide /> : <Welcome onInvite={invite} />}
      <div className="mn-ua-directory-bottom"><AccessGuide /><span><Mail size={13} />{access.members.filter(m => m.status === 'Invited').length} invitations waiting to be accepted</span></div>
    </section>
  </main>;
}
