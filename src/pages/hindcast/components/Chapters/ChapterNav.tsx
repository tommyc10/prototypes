/* The report's index: five chapters, each with its key and the one figure it's about, so the
 * strip itself is a summary. It sticks to the top of the desk while a chapter scrolls. */

import type { CSSProperties } from 'react';
import { num, pct } from '../../../../lib/format';
import { CHAPTERS, type ChapterId } from '../../model/chapters';
import type { Replay } from '../../model/replay';

function figure(id: ChapterId, r: Replay | null): string {
  if (!r) return ' ';
  const hand = r.population.closedByHand;
  switch (id) {
    case 'verdict':
      return hand ? `${pct(r.groups.unexplained / hand)} not explained` : 'Nothing closed by hand';
    case 'sources':
      return `${num(r.population.total)} tickets, ${num(r.activeRules + r.windows)} sources`;
    case 'caught':
      return `${num(r.groups.explained)} explained`;
    case 'tune':
      return `${num(r.gaps.length)} gaps, ${num(r.hypothetical.length)} rules`;
    case 'method':
      return 'How to read this';
  }
}

export function ChapterNav({ chapter, onChapter, replay }: { chapter: ChapterId; onChapter: (c: ChapterId) => void; replay: Replay | null }) {
  const at = CHAPTERS.findIndex((c) => c.id === chapter);
  return (
    <nav className="ol-chnav" aria-label="Chapters" style={{ '--at': at, '--n': CHAPTERS.length } as CSSProperties}>
      <span className="ol-chnav-thumb" aria-hidden />
      {CHAPTERS.map((c) => (
        <button key={c.id} className="ol-chnav-item" aria-current={chapter === c.id ? 'true' : undefined} data-active={chapter === c.id || undefined} onClick={() => onChapter(c.id)}>
          <span className="ol-chnav-top">
            <kbd>{c.key}</kbd>
            <span className="ol-chnav-name">{c.name}</span>
          </span>
          <span className="ol-chnav-fig">{figure(c.id, replay)}</span>
        </button>
      ))}
    </nav>
  );
}
