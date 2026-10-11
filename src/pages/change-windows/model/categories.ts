/* Sorting windows into categories, so the ones that belong together can be seen together.
 *
 * What a category is depends on the data. Where most windows have an assignment group, it's
 * the group. Where they don't (a release pipeline rarely fills that in), it's the family of
 * CI the window covers, read off the pattern its CIs are written with: `ds-battery-*` and
 * `ds-battery-07` are both `ds-battery`. */

import type { ChangeWindow } from './types';
import { UNASSIGNED, groupOf, statusOf } from './windows';

export interface Category {
  key: string;
  label: string;
  /** A second line, where there is one (a group's unit). */
  sub?: string;
  /** The label is a CI pattern, so it's set in mono. */
  mono: boolean;
}

export interface Categories {
  /** Every category, biggest first. */
  list: Category[];
  of: (w: ChangeWindow) => Category;
  /** What the categories are, for a heading: "group" or "CI family". */
  noun: string;
}

export function categorise(all: ChangeWindow[]): Categories {
  const byGroup = all.filter((w) => groupOf(w.groupId).id !== UNASSIGNED).length >= all.length / 2;
  const family = (cis: string) => cis.split('-').filter((part) => part && part !== '*').slice(0, 2).join('-') || cis;
  const keyOf = (w: ChangeWindow) => (byGroup ? groupOf(w.groupId).id : family(w.cis));
  const make = (key: string): Category => (byGroup ? { key, label: groupOf(key).name, sub: groupOf(key).unit, mono: false } : { key, label: `${key}-*`, mono: true });

  const sizes = new Map<string, number>();
  for (const w of all) sizes.set(keyOf(w), (sizes.get(keyOf(w)) ?? 0) + 1);
  // Biggest first; the name settles a tie, so the order never shuffles.
  const keys = [...sizes.keys()].sort((a, b) => sizes.get(b)! - sizes.get(a)! || a.localeCompare(b));
  const byKey = new Map(keys.map((key) => [key, make(key)]));
  return { list: [...byKey.values()], of: (w) => byKey.get(keyOf(w))!, noun: byGroup ? 'group' : 'CI family' };
}

/** A category with its windows, counted. */
export interface Group {
  category: Category;
  windows: ChangeWindow[];
  late: number;
  inPlace: number;
  upcoming: number;
}

/** Every category together, as the first entry in the list. */
export const EVERY: Category = { key: '*', label: 'Every window', mono: false };

/** The windows sorted into their categories and counted. "Every window" leads when there's more than one. */
export function groupsOf(windows: ChangeWindow[], now: number, categories: Categories): Group[] {
  const summary = (category: Category, own: ChangeWindow[]): Group => {
    const count = (status: string) => own.filter((w) => statusOf(w, now) === status).length;
    return { category, windows: own, late: count('overrunning'), inPlace: count('overrunning') + count('active'), upcoming: count('upcoming') };
  };
  const each = categories.list
    .map((category) => summary(category, windows.filter((w) => categories.of(w).key === category.key)))
    .filter((group) => group.windows.length)
    // What needs a look first: the ones with late windows, then the busiest.
    .sort((a, b) => b.late - a.late || b.inPlace - a.inPlace || b.windows.length - a.windows.length);
  return each.length > 1 ? [summary(EVERY, windows), ...each] : each;
}

/** The picked category if the search has left it. Otherwise the first real one: the one that most needs a look. */
export const groupFor = (groups: Group[], picked: string | null) =>
  groups.find((g) => g.category.key === picked) ?? groups.find((g) => g.category !== EVERY) ?? groups[0];
