/* The Midnight top bar, the same in every direction: brand, the chapter rail (label + one
 * segment per chapter, click to jump) and the way out to the dashboard. A direction can add
 * a readout in the corner. */

import type { ReactNode } from 'react';
import { CHAPTERS } from './story';
import type { ChromeProps } from './types';

export const DASHBOARD_URL = '/dashboard';

export function MidnightBar({ chapters, active, fills, onJump, readout }: ChromeProps & { readout?: ReactNode }) {
  return (
    <>
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
              <button key={c.id} type="button" className="rail-seg" onClick={() => onJump(i)} aria-label={`Chapter ${i + 1}: ${c.label}`} title={c.label}>
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
          Open the dashboard ↗
        </a>
      </header>
      {readout && <div className="readout">{readout}</div>}
    </>
  );
}

/** The chapter captions, stacked in one spot, in Midnight's type: "01 — The alert", title, body.
 *  `className` places the stack (Midnight's left column by default). */
export function Captions({ className = 'caps' }: { className?: string }) {
  return (
    <div className={className}>
      {CHAPTERS.map((c, i) => (
        <div className="cap" data-cap={c.id} key={c.id}>
          <div className="cap-meta cap-fade">
            <span className="num">{String(i + 1).padStart(2, '0')}</span>
            <span className="cap-rule" />
            {c.label}
          </div>
          <h2 className="cap-title">{c.title}</h2>
          <p className="cap-body cap-fade">{c.body}</p>
        </div>
      ))}
    </div>
  );
}
