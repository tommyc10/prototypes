/* Turning raw values into text. The data stores 0.93 and ISO dates; the UI shows "93%" and "2h ago". */

import { NOW } from './clock';

/** 0.93 → "93%" */
export const pct = (n: number) => `${Math.round(n * 100)}%`;

/** An ISO date → "just now", "5m ago", "3d ago"… */
export function ago(iso: string) {
  const diff = (NOW.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = Math.floor(diff / 86400);
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

/** An ISO date → "28 Sept" */
export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** Minutes → "12m" or "2h 5m" */
export const duration = (m: number) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`);
