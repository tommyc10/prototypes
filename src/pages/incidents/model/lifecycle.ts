/* The words the UI shows, and how it says lengths of time. */

import type { End, EndFilter, Lifecycle, StationId } from './types';

/** The checkpoints, in the order every incident meets them. */
export const STATIONS: StationId[] = ['raised', 'windows', 'rules', 'duplicates', 'enrichment', 'delivered'];

export const STATION_LABEL: Record<StationId, string> = {
  raised: 'Raised',
  windows: 'Change windows',
  rules: 'Rules',
  duplicates: 'Duplicates',
  enrichment: 'Enrichment',
  delivered: 'Delivered',
};

/** What each checkpoint asks. */
export const STATION_ASKS: Record<StationId, string> = {
  raised: 'A monitor saw something and opened an incident.',
  windows: 'Was it raised during planned work on the same thing?',
  rules: 'Does an active rule say this is noise?',
  duplicates: 'Is the same fault already open?',
  enrichment: 'Not noise: the Imperial Ops team adds what the owner will need.',
  delivered: 'Handed to the group that owns it.',
};

/** How many checkpoints an incident reaches, by how it ended: held at the change window is two
 *  (raised, windows), delivered is all six. The list row knows the ending before the journey
 *  arrives, so the waiting page can draw as many sections as will land. */
export const REACHED: Record<End, number> = { held: 2, suppressed: 3, folded: 4, noise: 5, enriching: 5, delivered: 6 };

export const END_LABEL: Record<End, string> = {
  held: 'Held by a change window',
  suppressed: 'Suppressed',
  folded: 'Folded into another',
  noise: 'Cleared as noise',
  enriching: 'Being enriched',
  delivered: 'Enriched and delivered',
};

export const END_SHORT: Record<End, string> = {
  held: 'Held',
  suppressed: 'Suppressed',
  folded: 'Folded',
  noise: 'Noise',
  enriching: 'Enriching',
  delivered: 'Delivered',
};

export const END_TABS: { key: EndFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'suppressed', label: 'Suppressed' },
  { key: 'enriched', label: 'Enriched' },
  { key: 'other', label: 'Other' },
];

export const inFilter = (l: Lifecycle, filter: EndFilter) =>
  filter === 'all' ||
  (filter === 'suppressed' ? l.end === 'suppressed' : filter === 'enriched' ? l.end === 'delivered' || l.end === 'enriching' : ['held', 'folded', 'noise'].includes(l.end));

/** A length of time → "0.4s", "12s", "3m 12s", "2h 5m" */
export function took(ms: number) {
  if (ms < 1000) return `${(ms / 1000).toFixed(1)}s`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return seconds % 60 ? `${minutes}m ${seconds % 60}s` : `${minutes}m`;
  return minutes % 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${Math.floor(minutes / 60)}h`;
}

export const clockFace = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const dayAndTime = (ms: number) =>
  `${new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
