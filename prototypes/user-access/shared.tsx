import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, GitBranch, Layers2, LockKeyhole, Mail, Plus, Search, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { allLeaves, groupLeaves, initials, leafId, scopeGroups, scopes, streamCount, type Access, type Member } from './model';

export function Status({ status }: { status: Member['status'] }) {
  return <span className="mn-ua-status" data-status={status}><span />{status}</span>;
}
export function Avatar({ member, large = false }: { member: Pick<Member, 'name'>; large?: boolean }) {
  return <span className="mn-ua-avatar" data-large={large || undefined} aria-hidden="true">{initials(member.name)}</span>;
}
export function SearchField({ value, onChange, placeholder = 'Search people or email…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !(e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable="true"]'))) { e.preventDefault(); ref.current?.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  return <label className="mn-ua-search"><Search size={14} /><input ref={ref} aria-label={placeholder} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />{value ? <button className="mn-icon-btn" aria-label="Clear search" onClick={() => onChange('')}><X size={13} /></button> : <kbd>/</kbd>}</label>;
}
export function PageHeading({ title = 'People & access', description = 'The right people. The right parts of the operation.', children }: { title?: string; description?: string; children?: ReactNode }) {
  return <header className="mn-ua-heading"><div><div className="mn-ua-eyebrow"><ShieldCheck size={13} /> Workspace administration</div><h1>{title}</h1><p>{description}</p></div>{children}</header>;
}
export function InviteButton({ onClick, quiet = false }: { onClick: (animate: boolean) => void; quiet?: boolean }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && !(e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable="true"]'))) { e.preventDefault(); onClick(false); }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onClick]);
  return <button className="mn-btn" data-variant={quiet ? 'secondary' : 'primary'} onClick={e => onClick(e.detail > 0)}><Plus size={15} />Invite person<kbd>N</kbd></button>;
}
export function Metrics({ access }: { access: Access }) {
  const stats = [['People', access.members.length, Users], ['Active members', access.members.filter(m => m.status === 'Active').length, ShieldCheck], ['Pending invitations', access.members.filter(m => m.status === 'Invited').length, Mail], ['Assignment groups', scopes.length, Layers2]] as const;
  return <div className="mn-ua-metrics">{stats.map(([label, value, Icon]) => <div key={label}><span><Icon size={14} />{label}</span><strong>{value.toString().padStart(2, '0')}</strong></div>)}</div>;
}
export function ScopeChips({ leaves }: { leaves: string[] }) {
  const groups = scopeGroups(leaves);
  return <div className="mn-ua-chips">{groups.map(g => <span key={g.id}><Layers2 size={11} />{g.name}</span>)}{groups.length === 0 && <span>No access</span>}</div>;
}
function ScopeCheck({ label, ids, selected, onChange, meta, children }: { label: string; ids: string[]; selected: string[]; onChange: (value: string[]) => void; meta?: string; children?: ReactNode }) {
  const ref = useRef<HTMLInputElement>(null);
  const count = ids.filter(id => selected.includes(id)).length;
  useEffect(() => { if (ref.current) ref.current.indeterminate = count > 0 && count < ids.length; }, [count, ids.length]);
  return <div className="mn-ua-check-line"><label><input ref={ref} type="checkbox" checked={count === ids.length} onChange={() => onChange(count === ids.length ? selected.filter(id => !ids.includes(id)) : [...new Set([...selected, ...ids])])} /><span>{label}</span>{meta && <small>{meta}</small>}</label>{children}</div>;
}
export function ScopeTree({ selected, onChange, spacious = false }: { selected: string[]; onChange: (value: string[]) => void; spacious?: boolean }) {
  const [expanded, setExpanded] = useState<string[]>(['holonet', 'reactor']);
  return <div className="mn-ua-tree" data-spacious={spacious || undefined}>
    <div className="mn-ua-tree-toolbar"><span><Layers2 size={13} /> Assignment groups</span><button type="button" onClick={() => onChange(selected.length === allLeaves.length ? [] : allLeaves)}>{selected.length === allLeaves.length ? 'Clear all' : 'Select all'}</button></div>
    {scopes.map(group => {
      const ids = groupLeaves(group), count = ids.filter(id => selected.includes(id)).length, open = expanded.includes(group.id);
      return <section className="mn-ua-tree-group" key={group.id} data-expanded={open || undefined}>
        <ScopeCheck label={group.name} ids={ids} selected={selected} onChange={onChange} meta={count + '/' + ids.length}>
          <button type="button" className="mn-icon-btn" aria-label={(open ? 'Collapse ' : 'Expand ') + group.name} aria-expanded={open} onClick={() => setExpanded(e => open ? e.filter(id => id !== group.id) : [...e, group.id])}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
        </ScopeCheck>
        {open && <div className="mn-ua-tree-branches">{group.streams.map(stream => <div className="mn-ua-stream" key={stream.name}>
          <ScopeCheck label={stream.name} ids={stream.subs.map(sub => leafId(group.id, stream.name, sub))} selected={selected} onChange={onChange} />
          <div className="mn-ua-tree-leaves">{stream.subs.map(sub => <ScopeCheck key={sub} label={sub} ids={[leafId(group.id, stream.name, sub)]} selected={selected} onChange={onChange} />)}</div>
        </div>)}</div>}
      </section>;
    })}
  </div>;
}
export function ActivityFeed({ access }: { access: Access }) {
  return <section className="mn-ua-activity"><div className="mn-ua-section-title"><h2><Clock3 size={14} />Recent changes</h2><span>This session</span></div>{access.activities.slice(0, 3).map((a, i) => <div className="mn-ua-event" key={a.id}><span className="mn-ua-event-mark"><Check size={11} /></span><div><p>{a.text}</p><small>{a.detail}</small></div><time>{i === 0 ? 'Just now' : 'Earlier'}</time></div>)}</section>;
}
export function Empty({ text = 'No people match your search.' }: { text?: string }) { return <div className="mn-ua-empty"><Search size={22} /><p>{text}</p><span>Try a different name or email.</span></div>; }

export function AccessEditor({ access, member, onClose, animate = false, wide = false, initialScope = [] }: { access: Access; member: Member | null; onClose: () => void; animate?: boolean; wide?: boolean; initialScope?: string[] }) {
  const [email, setEmail] = useState(member?.email ?? '');
  const [role, setRole] = useState<Member['role']>(member?.role ?? 'Member');
  const [selected, setSelected] = useState(member?.leaves ?? initialScope);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const own = member?.id === 'piett';
  const dirty = !member || role !== member.role || [...selected].sort().join('|') !== [...member.leaves].sort().join('|');
  useEffect(() => { if (!member) emailRef.current?.focus(); else if (animate) headingRef.current?.focus(); }, [member, animate]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); if (confirm) setConfirm(false); else onClose(); }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); formRef.current?.requestSubmit(); }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [confirm, onClose]);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!selected.length) { setError('Choose at least one sub-stream to grant access.'); return; }
    if (!member && access.members.some(m => m.email.toLowerCase() === normalized)) { setError('This person already has an invitation or access. Select them to edit it.'); return; }
    if (own) return;
    const name = member?.name ?? normalized.split('@')[0].split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    access.save({ id: member?.id ?? crypto.randomUUID(), name, email: normalized, role, status: member?.status ?? 'Invited', leaves: selected, seen: member?.seen ?? 'Invited just now' });
    onClose();
  }
  return <form className="mn-ua-editor" data-wide={wide || undefined} data-animate={animate || undefined} ref={formRef} onSubmit={submit}>
    <header className="mn-ua-editor-head"><div><span className="mn-ua-eyebrow">{member ? 'Access details' : 'Bring someone on board'}</span><h2 ref={headingRef} tabIndex={-1}>{member ? wide ? member.name : 'Manage access' : 'Invite a person'}</h2>{wide && member && <div className="mn-ua-wide-person-meta"><span>{member.email}</span><Status status={member.status} /></div>}</div><button type="button" className="mn-icon-btn" onClick={onClose} aria-label="Close access editor"><X size={16} /></button></header>
    <div className="mn-ua-editor-scroll">
      {member ? !wide && <div className="mn-ua-person-card"><Avatar member={member} large /><div><strong>{member.name}</strong><span title={member.email}>{member.email}</span><Status status={member.status} /></div></div> : <label className="mn-ua-field">Email address<div><Mail size={14} /><input ref={emailRef} required type="email" placeholder="name@imperial.navy" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} /></div><small>They’ll use this email to join your workspace.</small></label>}
      {own && <p className="mn-ua-note"><LockKeyhole size={14} />Your own admin access is protected. Ask another admin to change it.</p>}
      <fieldset disabled={own} className="mn-ua-editor-fields">
        <div className="mn-ua-role"><label className="mn-ua-field">Workspace role<select aria-label="Workspace role" value={role} onChange={e => setRole(e.target.value as Member['role'])}><option>Member</option><option>Admin</option></select></label><p>{role === 'Admin' ? 'Can manage people and permissions across the workspace. Operational data stays scoped below.' : 'Can work within the assignment groups, streams and sub-streams selected below.'}</p></div>
        <div className="mn-ua-access-heading"><h3>Operational access</h3><span>{scopeGroups(selected).length} {scopeGroups(selected).length === 1 ? 'group' : 'groups'} · {streamCount(selected)} {streamCount(selected) === 1 ? 'stream' : 'streams'}</span></div>
        <p className="mn-ua-description">Choose a whole group, a stream, or just the sub-streams they need.</p>
        <ScopeTree selected={selected} onChange={v => { setSelected(v); setError(''); }} spacious={wide} />
      </fieldset>
      <div className="mn-ua-scope-summary"><ShieldCheck size={15} /><div><strong>{selected.length} of {allLeaves.length} sub-streams selected</strong><span>New streams stay private until you grant access.</span></div></div>
      {error && <p className="mn-ua-error" role="alert">{error}</p>}
      {member && !own && <div className="mn-ua-remove">{confirm ? <><p>Remove {member.name}’s access to this workspace?</p><div><button type="button" className="mn-btn" onClick={() => setConfirm(false)}>Keep access</button><button type="button" className="mn-btn" data-variant="danger" onClick={() => { access.remove(member); onClose(); }}>Remove access</button></div></> : <button type="button" onClick={() => setConfirm(true)}><Trash2 size={13} />{member.status === 'Invited' ? 'Cancel invitation' : 'Remove access'}</button>}</div>}
    </div>
    <footer className="mn-ua-editor-footer"><span><LockKeyhole size={12} />{member ? 'Changes are recorded' : 'Prototype · no email is sent'}</span><div><button type="button" className="mn-btn" onClick={onClose}>Cancel</button><button className="mn-btn" data-variant="primary" disabled={own || !dirty} type="submit">{member ? 'Save changes' : 'Add invitation'}<kbd>⌘↵</kbd></button></div></footer>
  </form>;
}
export function AccessGuide() {
  return <div className="mn-ua-guide"><CircleHelp size={15} /><div><strong>Access follows the operation.</strong><p>Assignment group <ChevronRight size={10} /> Stream <ChevronRight size={10} /> Sub-stream</p><span>Grant the whole branch or choose only what’s needed.</span></div></div>;
}
export function PersonButton({ member, selected, onClick }: { member: Member; selected: boolean; onClick: (animate: boolean) => void }) {
  return <button className="mn-ua-person-row" data-selected={selected || undefined} onClick={e => onClick(e.detail > 0)} aria-pressed={selected}><Avatar member={member} /><span><strong>{member.name}</strong><small>{member.email}</small></span><span className="mn-ua-person-row-end">{member.status === 'Invited' ? <Mail size={13} /> : member.role === 'Admin' ? <ShieldCheck size={13} /> : <ChevronRight size={13} />}</span></button>;
}
export function Welcome({ onInvite }: { onInvite: (animate: boolean) => void }) {
  return <div className="mn-ua-welcome"><div className="mn-ua-welcome-icon"><Users size={22} /></div><h2>A place for everyone.<br />Access for what they need.</h2><p>Select a person to review their access, or invite someone to the operation.</p><InviteButton onClick={onInvite} /><div><GitBranch size={14} /> Precise permissions, down to the sub-stream.</div></div>;
}
export function EditArrow() { return <ArrowRight size={14} aria-hidden="true" />; }
