/* Brand, the chapter rail, and the way out to the real dashboard. */

import type { RefObject } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { type Chapter, DASHBOARD_URL } from './data';

export function TopBar({
  chapters,
  active,
  fills,
  onJump,
}: {
  chapters: Chapter[];
  active: number;
  fills: RefObject<(HTMLSpanElement | null)[]>;
  onJump: (i: number) => void;
}) {
  return (
    <header className="topbar">
      <span className="brand">
        <span className="brand-mark" />
        Midnight
      </span>

      <nav className="rail" aria-label="Chapters">
        <span className="rail-label" aria-live="polite">
          {active >= 0 && (
            <>
              <span className="num subtle">{String(active + 1).padStart(2, '0')}</span> {chapters[active].label}
            </>
          )}
        </span>
        <span className="rail-segs">
          {chapters.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className="rail-seg"
              data-active={i === active || undefined}
              onClick={() => onJump(i)}
              aria-label={`Chapter ${i + 1}: ${c.label}`}
              title={c.label}
            >
              <span
                className="rail-fill"
                ref={(el) => {
                  fills.current[i] = el;
                }}
              />
            </button>
          ))}
        </span>
      </nav>

      <a className="btn topbar-cta" href={DASHBOARD_URL}>
        Open the dashboard
        <ArrowUpRight size={14} strokeWidth={2} />
      </a>
    </header>
  );
}
