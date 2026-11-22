/* Dev only: flip Aide between its demo data and the worst realistic case (see fixtures.ts).
 * The choice lives in ?aide=… so a reload keeps it. Plain chrome, not part of the design. */

import { useEffect, useState } from 'react';
import { useAide } from '../useAide';
import { fixture, FIXTURE_NAMES, type FixtureName } from './fixtures';

const LABEL: Record<FixtureName, string> = { demo: 'Demo data', worst: 'Worst case', empty: 'Empty', one: 'One', huge: '400 messages' };

const fromUrl = (): FixtureName => FIXTURE_NAMES.find((n) => n === new URLSearchParams(window.location.search).get('aide')) ?? 'demo';

export function DataToggle() {
  const [name, setName] = useState<FixtureName>(fromUrl);

  useEffect(() => {
    if (name !== 'demo') useAide.setState(fixture(name));
  }, []);

  const pick = (next: FixtureName) => {
    setName(next);
    useAide.setState(fixture(next));
    const url = new URL(window.location.href);
    if (next === 'demo') url.searchParams.delete('aide');
    else url.searchParams.set('aide', next);
    history.replaceState(null, '', url);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Aide test data"
      style={{
        position: 'fixed',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99,
        display: 'flex',
        gap: 2,
        padding: 3,
        borderRadius: 999,
        background: '#d4d4d4',
        font: '500 12px system-ui, sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {FIXTURE_NAMES.map((n) => (
        <button
          key={n}
          role="radio"
          aria-checked={n === name}
          onClick={() => pick(n)}
          style={{ border: 0, borderRadius: 999, padding: '5px 10px', background: n === name ? '#fff' : 'transparent', color: '#111', cursor: 'pointer' }}
        >
          {LABEL[n]}
        </button>
      ))}
    </div>
  );
}
