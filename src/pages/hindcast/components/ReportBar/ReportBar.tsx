/* The bar that stays at the top of the report: the pane toggles, the chapters (the one being
 * read is lit, and pressing one goes there), and the lookback. The lookback scopes everything
 * on the page, list included, so it lives up here and nowhere else. */

import { useEffect, useRef, type ReactNode } from 'react';
import { CHAPTERS, LOOKBACKS, type ChapterId } from '../../model/labels';
import type { Lookback } from '../../model/types';
import './ReportBar.css';

export function ReportBar({
  toolbar,
  active,
  scrolled,
  onJump,
  weeks,
  onWeeks,
}: {
  /** Buttons at the start of the bar (the sidebar and list toggles). */
  toolbar?: ReactNode;
  active: ChapterId;
  /** The report has scrolled under the bar, so it draws its bottom edge. */
  scrolled: boolean;
  onJump: (id: ChapterId) => void;
  weeks: Lookback;
  onWeeks: (weeks: Lookback) => void;
}) {
  // In a narrow pane the chapters scroll sideways: keep the one being read in sight.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const tab = nav?.querySelector<HTMLElement>('[data-active]');
    if (nav && tab) nav.scrollTo({ left: tab.offsetLeft - nav.offsetLeft - 28 });
  }, [active]);

  return (
    <div className="hc-top" data-scrolled={scrolled || undefined}>
      {toolbar}
      <nav className="mn-tabs hc-chapters" aria-label="Chapters" data-tour="hc-chapters" ref={navRef}>
        {CHAPTERS.map((chapter) => (
          <button
            key={chapter.id}
            className="mn-tab"
            data-active={active === chapter.id || undefined}
            aria-current={active === chapter.id ? 'location' : undefined}
            onClick={() => onJump(chapter.id)}
          >
            {chapter.label}
          </button>
        ))}
      </nav>
      <div className="hc-lookback" role="radiogroup" aria-label="Lookback, in completed weeks" data-tour="hc-lookback">
        <span className="mn-subtle hc-lookback-label">Completed weeks</span>
        <div className="mn-tabs">
          {LOOKBACKS.map((option) => (
            <button
              key={option}
              role="radio"
              aria-checked={weeks === option}
              className="mn-tab"
              data-active={weeks === option || undefined}
              onClick={() => onWeeks(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
