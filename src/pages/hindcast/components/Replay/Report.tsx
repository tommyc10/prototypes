/* The replay's report, the same for the current replay and for a historical extract's
 * aggregate, told in five chapters rather than one long page: the verdict, the sources it read,
 * what caught the tickets, what to tune next, and the method. One chapter shows at a time, sized
 * to the screen; the tickets sit beside it in the dock (Tickets.tsx), so whatever a chapter
 * picks, the tickets it counted are already in view.
 *
 * Before the first run lands, soft shapes stand where the chapter will. During a later run the
 * chapter keeps its figures, dimmed, and morphs to the new ones when it finishes. */

import type { CSSProperties, ReactNode } from 'react';
import type { ChapterId } from '../../model/chapters';
import type { Focus, Narrowing } from '../../model/narrow';
import type { Replay } from '../../model/replay';
import type { LifeKey } from '../../model/words';
import { CaughtBy } from '../Chapters/CaughtBy';
import { ChapterNav } from '../Chapters/ChapterNav';
import { Method } from '../Chapters/Method';
import { SourcesChapter } from '../Chapters/SourcesChapter';
import { TuneNext } from '../Chapters/TuneNext';
import { VerdictChapter } from '../Chapters/Verdict';
import '../Chapters/chapters.css';

export interface Expect {
  sources: number;
  hypothetical: number;
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="ol-ch" aria-hidden>
      <span className="mn-skel" style={{ width: '42%', height: 40, borderRadius: 6 }} />
      <span className="mn-skel" style={{ width: '100%', height: 22, borderRadius: 4 }} />
      <div className="ol-skel-rows">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="ol-skel-row">
            <span className="mn-skel" style={{ width: `${46 + ((i * 37) % 30)}%`, height: 10 } as CSSProperties} />
            <span className="mn-skel" style={{ width: 28, height: 10 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Report({
  replay: r,
  stale,
  expect,
  narrowing,
  onFocus,
  onLife,
  onWeeks,
  chapter,
  onChapter,
  basis,
  land,
}: {
  replay: Replay | null;
  stale: boolean;
  expect: Expect;
  narrowing: Narrowing;
  onFocus: (f: Focus | null) => void;
  onLife: (k: LifeKey | null) => void;
  onWeeks: (w: [number, number] | null) => void;
  chapter: ChapterId;
  onChapter: (c: ChapterId) => void;
  /** Whose logic this is, in a few words: "Today’s rules" or "Rules as of 4 Sept". */
  basis: string;
  /** The first run just landed on a fresh load: its content draws itself in. */
  land: boolean;
}) {
  let body: ReactNode;
  if (!r) body = <Skeleton rows={chapter === 'caught' ? Math.max(3, expect.sources) : 8} />;
  else if (chapter === 'verdict') body = <VerdictChapter r={r} focus={narrowing.focus} onFocus={onFocus} range={narrowing.weeks} onRange={onWeeks} />;
  else if (chapter === 'sources') body = <SourcesChapter r={r} life={narrowing.life} onLife={onLife} focus={narrowing.focus} onFocus={onFocus} basis={basis} />;
  else if (chapter === 'caught') body = <CaughtBy r={r} focus={narrowing.focus} onFocus={onFocus} />;
  else if (chapter === 'tune') body = <TuneNext r={r} focus={narrowing.focus} onFocus={onFocus} />;
  else body = <Method r={r} focus={narrowing.focus} onFocus={onFocus} basis={basis} />;

  return (
    <div className="ol-report" data-land={land || undefined} aria-busy={!r || stale}>
      <ChapterNav chapter={chapter} onChapter={onChapter} replay={r} />
      <div className="ol-chapter ol-stale" key={chapter} data-sheen-stale={(r && stale) || undefined}>
        {body}
      </div>
    </div>
  );
}
