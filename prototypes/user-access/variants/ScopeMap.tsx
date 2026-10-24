import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronRight, GitBranch, Layers2, LockKeyhole, Mail, Minus, Users, X } from 'lucide-react';
import { groupLeaves, leafId, scopes, type Access, type Member } from '../model';
import { AccessEditor, ActivityFeed, Avatar, Empty, InviteButton, PageHeading, SearchField, Status } from '../shared';

export default function ScopeMap({ access }: { access: Access }) {
  const [groupId, setGroupId] = useState('holonet');
  const [query, setQuery] = useState('');
  const [onlyMembers, setOnlyMembers] = useState(false);
  const [selected, setSelected] = useState<Member | null | undefined>();
  const [animate, setAnimate] = useState(false);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const group = scopes.find(g => g.id === groupId)!;
  const ids = groupLeaves(group);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dirty = Object.keys(draft).length > 0;
  const people = access.members.filter(m => (m.name + m.email).toLowerCase().includes(query.toLowerCase()) && (!onlyMembers || ids.some(id => (draft[m.id] ?? m.leaves).includes(id))));
  const count = access.members.filter(m => ids.some(id => m.leaves.includes(id))).length;
  function invite(motion: boolean) { setSelected(null); setAnimate(motion); }
  function toggle(member: Member, branch: string[]) {
    const current = draft[member.id] ?? member.leaves;
    const full = branch.every(id => current.includes(id));
    const next = full ? current.filter(id => !branch.includes(id)) : [...new Set([...current, ...branch])];
    setDraft(d => { const result = { ...d }; if ([...next].sort().join('|') === [...member.leaves].sort().join('|')) delete result[member.id]; else result[member.id] = next; return result; });
  }
  function save() {
    access.saveMany(draft);
    setDraft({});
  }
  function clearDraft(id: string) {
    setDraft(d => { const next = { ...d }; delete next[id]; return next; });
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (dirty && selected === undefined && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); } };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  });
  return <main className="mn-ua-page" data-layout="scope-map">
    <PageHeading title="Access, mapped out." description="Start with the operation. See exactly who belongs where."><InviteButton onClick={invite} quiet={dirty || selected !== undefined} /></PageHeading>
    <div className="mn-ua-scope-map-body">
      <div className="mn-ua-scope-cards" aria-label="Assignment groups">{scopes.map(g => <button key={g.id} data-selected={groupId === g.id || undefined} onClick={() => setGroupId(g.id)} aria-pressed={groupId === g.id}><div><span className="mn-ua-group-icon"><Layers2 size={17} /></span>{groupId === g.id ? <span className="mn-ua-viewing">Viewing<Check size={11} /></span> : <ArrowRight size={14} />}</div><strong>{g.name}</strong><span>{g.unit}</span><footer><span><Users size={12} />{access.members.filter(m => groupLeaves(g).some(id => m.leaves.includes(id))).length} people</span><span>{g.streams.length} streams</span></footer></button>)}</div>
      <div className="mn-ua-map-panel"><div className="mn-ua-map-title"><div><span className="mn-ua-eyebrow"><Layers2 size={12} />Assignment group<ChevronRight size={10} />{group.unit}</span><h2 ref={titleRef} tabIndex={-1}>{group.name}<span>{count} people with access</span></h2></div><span className="mn-ua-map-explainer"><GitBranch size={13} />Select a stream, or expand to go deeper.</span></div>
        <div className="mn-ua-table-tools"><SearchField value={query} onChange={setQuery} /><label className="mn-ua-filter-check"><input type="checkbox" checked={onlyMembers} onChange={e => setOnlyMembers(e.target.checked)} />Only people with access</label></div>
        <div className="mn-ua-table-wrap"><table className="mn-ua-table mn-ua-matrix"><thead><tr><th>Person</th>{group.streams.map(s => <th key={s.name}><div>{s.name}<small>2 sub-streams</small></div></th>)}<th>Status</th><th><span className="mn-sr">Edit</span></th></tr></thead><tbody>{people.map(m => <tr key={m.id}><td><button className="mn-ua-table-person" onClick={e => { setSelected(m); setAnimate(e.detail > 0); }}><Avatar member={m} /><span><strong>{m.name}{m.id === 'piett' && <small>You</small>}</strong><small>{m.role}</small></span></button></td>{group.streams.map(s => {
          const branch = s.subs.map(sub => leafId(group.id, s.name, sub)), leaves = draft[m.id] ?? m.leaves, n = branch.filter(id => leaves.includes(id)).length;
          return <td key={s.name}><div className="mn-ua-matrix-cell"><button className="mn-ua-permission" data-checked={n === branch.length || undefined} disabled={m.id === 'piett'} aria-label={s.name + ' access for ' + m.name} aria-pressed={n === branch.length ? true : n ? 'mixed' : false} onClick={() => toggle(m, branch)}>{n === branch.length ? <Check size={13} /> : n ? <Minus size={13} /> : <PlusMark />}<span>{n === branch.length ? 'Full stream' : n ? 'Partial access' : 'No access'}</span></button><details><summary aria-label={'Sub-streams in ' + s.name + ' for ' + m.name}><ChevronRight size={13} /></summary><div className="mn-ua-submenu"><span>{s.name}</span>{s.subs.map(sub => <label key={sub}><input type="checkbox" disabled={m.id === 'piett'} checked={leaves.includes(leafId(group.id, s.name, sub))} onChange={() => toggle(m, [leafId(group.id, s.name, sub)])} />{sub}</label>)}</div></details></div></td>;
        })}<td><Status status={m.status} /></td><td><button className="mn-icon-btn" aria-label={'Manage ' + m.name} onClick={e => { setSelected(m); setAnimate(e.detail > 0); }}><ArrowRight size={14} /></button></td></tr>)}</tbody></table>{!people.length && <Empty />}</div>
        <footer className="mn-ua-map-foot"><span><LockKeyhole size={12} />Changes apply only to selected sub-streams.</span><span><Mail size={12} />Invitations inherit the access shown here.</span></footer>
      </div>
      <ActivityFeed access={access} />
    </div>
    {dirty && <div className="mn-ua-save-bar" role="region" aria-label="Unsaved permission changes"><div><span className="mn-ua-unsaved-dot" /><strong>{Object.keys(draft).length} {Object.keys(draft).length === 1 ? 'person has' : 'people have'} unsaved changes</strong></div><div><button className="mn-btn" onClick={() => setDraft({})}>Discard</button><button className="mn-btn" data-variant={selected === undefined ? 'primary' : 'secondary'} onClick={save}>Save access<kbd>⌘↵</kbd></button></div></div>}
    {selected !== undefined && <dialog className="mn-ua-overlay-editor" aria-label={selected ? 'Manage access' : 'Invite a person'} ref={el => { if (el && !el.open) el.showModal(); }} onCancel={e => { e.preventDefault(); setSelected(undefined); titleRef.current?.focus(); }}><AccessEditor key={selected?.id ?? 'invite'} access={{ ...access, save: member => { access.save(member); clearDraft(member.id); }, remove: member => { access.remove(member); clearDraft(member.id); } }} member={selected ? { ...selected, leaves: draft[selected.id] ?? selected.leaves } : null} initialScope={ids} animate={animate} onClose={() => { setSelected(undefined); titleRef.current?.focus(); }} /></dialog>}
  </main>;
}
function PlusMark() { return <X size={11} className="mn-ua-no-access" />; }
