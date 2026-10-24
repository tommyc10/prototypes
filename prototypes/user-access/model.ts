import { useState } from 'react';

export const scopes = [
  { id: 'reactor', name: 'Reactor Core', unit: 'Death Star', streams: [
    { name: 'Power distribution', subs: ['Main bus', 'Auxiliary bus'] },
    { name: 'Core monitoring', subs: ['Temperature', 'Coolant flow'] },
  ] },
  { id: 'holonet', name: 'HoloNet Comms', unit: 'ISB', streams: [
    { name: 'Relay network', subs: ['Core worlds', 'Outer Rim'] },
    { name: 'Secure channels', subs: ['Command', 'Fleet'] },
  ] },
  { id: 'hangar', name: 'TIE Hangar Ops', unit: 'Imperial Navy', streams: [
    { name: 'Flight operations', subs: ['Launch control', 'Recovery'] },
    { name: 'Fleet readiness', subs: ['Maintenance', 'Fuel systems'] },
  ] },
  { id: 'facilities', name: 'Facilities', unit: 'Death Star', streams: [
    { name: 'Station systems', subs: ['Turbolifts', 'Access control'] },
    { name: 'Environmental', subs: ['Life support', 'Atmosphere'] },
  ] },
];
export const leafId = (group: string, stream: string, sub: string) => [group, stream, sub].join('/');
export const groupLeaves = (group: typeof scopes[number]) => group.streams.flatMap(s => s.subs.map(sub => leafId(group.id, s.name, sub)));
export const allLeaves = scopes.flatMap(groupLeaves);
export const scopeGroups = (leaves: string[]) => scopes.filter(g => groupLeaves(g).some(id => leaves.includes(id)));
export const streamCount = (leaves: string[]) => new Set(leaves.map(id => id.split('/').slice(0, 2).join('/'))).size;
export type Member = { id: string; name: string; email: string; role: 'Member' | 'Admin'; status: 'Active' | 'Invited'; leaves: string[]; seen: string };
export type Activity = { id: string; text: string; detail: string };
export const initialMembers: Member[] = [
  { id: 'piett', name: 'Admiral Piett', email: 'a.piett@imperial.navy', role: 'Admin', status: 'Active', leaves: allLeaves, seen: 'You' },
  { id: 'tanbris', name: 'Lieutenant Tanbris', email: 'l.tanbris@imperial.navy', role: 'Member', status: 'Active', leaves: [...groupLeaves(scopes[1]), ...groupLeaves(scopes[0]).slice(0, 2)], seen: '12 min ago' },
  { id: 'bast', name: 'Chief Bast', email: 'c.bast@imperial.navy', role: 'Admin', status: 'Active', leaves: [...groupLeaves(scopes[0]), ...groupLeaves(scopes[3])], seen: '28 min ago' },
  { id: 'praji', name: 'Commander Praji', email: 'c.praji@imperial.navy', role: 'Member', status: 'Active', leaves: groupLeaves(scopes[2]), seen: '1 hour ago' },
  { id: 'jerjerrod', name: 'Moff Jerjerrod', email: 'm.jerjerrod@imperial.navy', role: 'Member', status: 'Invited', leaves: groupLeaves(scopes[3]), seen: 'Invited today' },
  { id: 'idan', name: 'Captain Idan', email: 'i.idan@imperial.navy', role: 'Member', status: 'Active', leaves: groupLeaves(scopes[1]).slice(0, 2), seen: '3 hours ago' },
  { id: 'lennox', name: 'Captain Lennox', email: 'l.lennox@imperial.navy', role: 'Member', status: 'Invited', leaves: [...groupLeaves(scopes[1]).slice(2), ...groupLeaves(scopes[2]).slice(0, 2)], seen: 'Invited yesterday' },
  { id: 'needa', name: 'Captain Needa', email: 'l.needa@imperial.navy', role: 'Member', status: 'Active', leaves: groupLeaves(scopes[2]).slice(0, 2), seen: 'Yesterday' },
];
const KEY = 'imperial-ops-user-access-prototype-v1';
function readMembers(): Member[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(value) && value.length && value.every(m => m && typeof m.id === 'string' && typeof m.email === 'string' && typeof m.name === 'string' && ['Member', 'Admin'].includes(m.role) && ['Active', 'Invited'].includes(m.status) && Array.isArray(m.leaves) && m.leaves.every((l: unknown) => typeof l === 'string' && allLeaves.includes(l)))) return value;
  } catch { /* A fresh prototype is still usable when storage is unavailable. */ }
  return initialMembers;
}
export function useAccess() {
  const [members, setMembers] = useState(readMembers);
  const [activities, setActivities] = useState<Activity[]>([
    { id: 'seed-1', text: 'Moff Jerjerrod invited', detail: 'Facilities · by Admiral Piett' },
    { id: 'seed-2', text: 'Chief Bast’s access updated', detail: 'Reactor Core, Facilities · by Admiral Piett' },
  ]);
  const [notice, setNotice] = useState('');
  function commit(next: Member[], text: string, detail: string) {
    setMembers(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* State remains available for this session. */ }
    setActivities(a => [{ id: crypto.randomUUID(), text, detail }, ...a].slice(0, 8));
    setNotice(text + '. Saved in this browser.');
  }
  function save(member: Member) {
    const exists = members.some(m => m.id === member.id);
    commit(exists ? members.map(m => m.id === member.id ? member : m) : [...members, member], exists ? member.name + '’s access updated' : 'Demo invitation added for ' + member.email, scopeGroups(member.leaves).map(g => g.name).join(', ') + ' · by Admiral Piett');
  }
  function saveMany(changes: Record<string, string[]>) {
    const count = Object.keys(changes).length;
    commit(members.map(m => changes[m.id] ? { ...m, leaves: changes[m.id] } : m), 'Access updated for ' + count + (count === 1 ? ' person' : ' people'), 'Operational permissions · by Admiral Piett');
  }
  function remove(member: Member) {
    commit(members.filter(m => m.id !== member.id), member.name + '’s access removed', 'By Admiral Piett');
  }
  return { members, activities, notice, setNotice, save, saveMany, remove };
}
export type Access = ReturnType<typeof useAccess>;
export const initials = (name: string) => name.split(/[\s.@]+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
