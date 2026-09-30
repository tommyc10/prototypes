/* Switch between the directions. Chrome, not a contestant: plain and neutral, the same on every
 * direction. Switching reloads the page (?d=…), so each film starts clean at the top. */

import { useEffect } from 'react';
import type { Direction } from './types';

export function Picker({ directions, current }: { directions: Direction[]; current: Direction['id'] }) {
  const go = (id: string) => {
    if (id === current) return;
    const url = new URL(location.href);
    url.searchParams.set('d', id);
    location.href = url.toString();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest('input, textarea')) return;
      const i = Number(e.key) - 1;
      if (directions[i]) go(directions[i].id);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  return (
    <nav className="picker" aria-label="Direction">
      {directions.map((d, i) => (
        <button key={d.id} type="button" data-on={d.id === current || undefined} onClick={() => go(d.id)} title={d.blurb}>
          <kbd>{i + 1}</kbd>
          {d.name}
        </button>
      ))}
    </nav>
  );
}
