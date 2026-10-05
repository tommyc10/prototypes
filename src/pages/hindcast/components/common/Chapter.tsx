/* One chapter of the report: a numbered kicker, the question it answers, then its modules.
 * The id is what the chapter tabs scroll to. */

import type { ReactNode } from 'react';
import { CHAPTERS, type ChapterId } from '../../model/labels';

export function Chapter({ id, children }: { id: ChapterId; children: ReactNode }) {
  const index = CHAPTERS.findIndex((c) => c.id === id);
  const chapter = CHAPTERS[index];
  return (
    <section className="hc-chapter" id={id} aria-labelledby={`${id}-title`}>
      <header className="hc-chapter-head">
        <div className="hc-kicker mn-mono">
          {String(index + 1).padStart(2, '0')} <span>{chapter.label}</span>
        </div>
        <h2 id={`${id}-title`}>{chapter.question}</h2>
      </header>
      {children}
    </section>
  );
}
