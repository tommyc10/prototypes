/* Working with the tree of streams, sub-streams and assignment groups.
 *
 * Grants are kept tidy: never an id whose stream or sub-stream is also granted, and when
 * every part of a branch is granted, the branch itself is granted instead. So ticking each
 * sub-stream of a stream in turn ends in the stream being ticked, which is what the
 * checkbox shows, and it then covers whatever is added to that stream later.
 *
 * Nothing here is stored; it's worked out from the tree and a person's grants. */

import { STREAMS } from '../data/mockData';
import type { Scope, ScopeKind } from './types';

const byId = new Map<string, Scope>();
const parentOf = new Map<string, Scope>();
(function index(nodes: Scope[], parent?: Scope) {
  for (const node of nodes) {
    byId.set(node.id, node);
    if (parent) parentOf.set(node.id, parent);
    index(node.children, node);
  }
})(STREAMS);

export const scopeById = (id: string) => byId.get(id);

/** The stream, then the sub-stream, above this one. */
export function ancestors(id: string): Scope[] {
  const out: Scope[] = [];
  for (let p = parentOf.get(id); p; p = parentOf.get(p.id)) out.unshift(p);
  return out;
}

/** Every assignment group in a branch (a group is its own only one). */
export function groupsIn(node: Scope): Scope[] {
  return node.kind === 'group' ? [node] : node.children.flatMap(groupsIn);
}

export const ALL_GROUPS = STREAMS.flatMap(groupsIn);

/** Every assignment group someone with these grants can see. */
export function coveredGroups(grants: string[]): Set<string> {
  const out = new Set<string>();
  for (const id of grants) {
    const node = byId.get(id);
    if (node) for (const g of groupsIn(node)) out.add(g.id);
  }
  return out;
}

export type Tick = 'on' | 'mixed' | 'off';

/** On: it's granted, or its stream or sub-stream is. Mixed: some of what's inside it is. */
export function tickOf(node: Scope, grants: string[]): Tick {
  const set = new Set(grants);
  if (set.has(node.id) || ancestors(node.id).some((a) => set.has(a.id))) return 'on';
  return grants.some((id) => id.startsWith(`${node.id}/`)) ? 'mixed' : 'off';
}

/** Tidy a set of grants: drop anything already covered from above, then let a branch whose
 *  every part is granted stand for its parts. */
export function tidy(grants: Iterable<string>): string[] {
  let set = new Set([...grants].filter((id) => byId.has(id)));
  set = new Set([...set].filter((id) => !ancestors(id).some((a) => set.has(a.id))));
  // Deepest first, so a sub-stream is promoted before its stream is looked at.
  const branches = [...byId.values()].filter((n) => n.children.length).sort((a, b) => b.id.split('/').length - a.id.split('/').length);
  for (const branch of branches) {
    if (branch.children.every((child) => set.has(child.id))) {
      for (const child of branch.children) set.delete(child.id);
      set.add(branch.id);
    }
  }
  return order([...set]);
}

/** Tree order, so a list of grants always reads top to bottom. */
const position = new Map([...byId.keys()].map((id, i) => [id, i]));
const order = (ids: string[]) => ids.sort((a, b) => (position.get(a) ?? 0) - (position.get(b) ?? 0));

/** Tick or untick one part. Unticking a part of something granted whole keeps the rest of it. */
export function toggle(grants: string[], id: string): string[] {
  const node = byId.get(id);
  if (!node) return grants;
  if (tickOf(node, grants) !== 'on') {
    return tidy([...grants.filter((g) => !g.startsWith(`${id}/`)), id]);
  }
  const set = new Set(grants);
  if (set.has(id)) {
    set.delete(id);
    return tidy(set);
  }
  // Granted from above: split the grant down the path, keeping every sibling on the way.
  const path = [...ancestors(id), node];
  const top = path.findIndex((p) => set.has(p.id));
  set.delete(path[top].id);
  for (let i = top; i < path.length - 1; i++) {
    for (const child of path[i].children) if (child.id !== path[i + 1].id) set.add(child.id);
  }
  return tidy(set);
}

/** Tick a part (used by the search: ↵ adds the top match). */
export const grant = (grants: string[], id: string) => tidy([...grants, id]);

export const KIND: Record<ScopeKind, { one: string; many: string }> = {
  stream: { one: 'stream', many: 'streams' },
  substream: { one: 'sub-stream', many: 'sub-streams' },
  group: { one: 'assignment group', many: 'assignment groups' },
};

/** "1 group", "3 groups" */
export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

/** What changes between two sets of grants, as the fewest names that say it: a whole
 *  sub-stream added reads as that sub-stream, not each of its groups. */
export function difference(before: string[], after: string[]) {
  const was = coveredGroups(before);
  const now = coveredGroups(after);
  const added = tidy([...now].filter((id) => !was.has(id))).map((id) => byId.get(id)!);
  const removed = tidy([...was].filter((id) => !now.has(id))).map((id) => byId.get(id)!);
  return { added, removed };
}

/** "Reactor Core", "Reactor Core and Superlaser", "Reactor Core, Superlaser and 2 more" */
export function names(scopes: Scope[], max = 2): string {
  if (scopes.length <= max) return scopes.map((s) => s.name).join(' and ');
  const rest = scopes.length - max;
  return `${scopes.slice(0, max).map((s) => s.name).join(', ')} and ${rest} more`;
}

/** Every word of the search is somewhere in the name. */
export function nameMatches(name: string, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((w) => name.toLowerCase().includes(w));
}

/** The parts a search finds, in tree order: anything named for it, and what's inside that. */
export function searchTree(query: string): { shown: Set<string>; hits: Scope[] } {
  const shown = new Set<string>();
  const hits: Scope[] = [];
  const walk = (node: Scope, inside: boolean) => {
    const hit = nameMatches(node.name, query);
    if (hit) hits.push(node);
    let any = hit || inside;
    for (const child of node.children) any = walk(child, hit || inside) || any;
    if (any) shown.add(node.id);
    return any;
  };
  STREAMS.forEach((s) => walk(s, false));
  return { shown, hits };
}
