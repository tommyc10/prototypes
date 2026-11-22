/* Throwaway: what every home prototype reads from the station, said the same way in each,
 * so the variants differ only in how they lay it out. */

import { useEffect, useState } from 'react';
import { MINUTE, WINDOW_MINUTES } from '../../pages/alerts/data/mockData';
import { clockFace, plural, toneOf, type GroupReading, type Need, type Station } from '../../pages/home/model/station';

export type Tone = 'bad' | 'warn' | 'plain';

export interface VariantProps {
  data: Station;
}

/** The tag a group wears: the most pressing thing of its that's waiting, or what it's doing. */
export function groupTag(g: GroupReading): { tone: Tone | null; label: string } {
  const tone = toneOf(g);
  if (tone === 'bad') return { tone, label: `${plural(g.risky, 'page')} a proposal would hide` };
  if (tone === 'warn') return { tone, label: `${plural(g.late, 'window')} past its end` };
  if (tone === 'plain') return { tone, label: `${plural(g.proposed, 'rule')} waiting` };
  if (g.windows > 0) return { tone: null, label: `${plural(g.windows, 'window')} in place` };
  return { tone: null, label: 'Nothing waiting' };
}

/** The whole station's hour, five minutes at a time. */
export const hourSeries = (groups: GroupReading[]) =>
  Array.from({ length: 12 }, (_, i) => groups.reduce((sum, g) => ({ total: sum.total + g.buckets[i].total, paged: sum.paged + g.buckets[i].paged }), { total: 0, paged: 0 }));

/** "15:05" for the start of bucket i. */
export const bucketStart = (now: number, i: number) => clockFace(now - WINDOW_MINUTES * MINUTE + i * 5 * MINUTE);

export const openLabel = (need: Need) => (need.kind === 'Change window' ? 'Open the window' : 'Open the rule');

export function greeting(now: number, name: string) {
  const hour = new Date(now).getHours();
  return `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${name.split(' ')[0]}.`;
}

/** What's in the queue, said in one sentence. */
export function queueSentence(queue: Need[]) {
  if (queue.length === 0) return 'Nothing is waiting on you.';
  const late = queue.filter((n) => n.kind === 'Change window').length;
  const rules = queue.length - late;
  const risky = queue.filter((n) => n.tone === 'bad').length;
  const parts = [late && `${plural(late, 'change window')} past ${late === 1 ? 'its' : 'their'} end`, rules && `${plural(rules, 'proposed rule')}`].filter(Boolean);
  const tail = risky ? `, and ${risky === 1 ? 'one of the rules would' : `${risky} of the rules would`} hide real pages` : '';
  return `${plural(queue.length, 'thing')} ${queue.length === 1 ? 'is' : 'are'} waiting on you: ${parts.join(' and ')}${tail}.`;
}

/** J and K walk the queue, Enter opens the one you're on. Keys typed into a field are left alone. */
export function useCursor(queue: Need[]) {
  const [at, setAt] = useState(0);
  const index = Math.min(at, Math.max(0, queue.length - 1));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable) return;
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setAt((i) => Math.min(queue.length - 1, Math.min(i, queue.length - 1) + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setAt((i) => Math.max(0, Math.min(i, queue.length - 1) - 1));
      } else if (e.key === 'Enter' && queue[index] && el.tagName !== 'A' && el.tagName !== 'BUTTON') {
        location.hash = queue[index].href;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [queue, index]);
  return { index, need: queue[index], setAt };
}

/** Move the cursor to the first thing waiting for a group, if it has one. */
export const firstOf = (queue: Need[], groupId: string) => queue.findIndex((n) => n.groupId === groupId);

/** CHG-2398 or RUL-0428: the id the thing's own page uses, read from its link. */
export const idOf = (need: Need) => need.href.split('/').pop() ?? need.key;
