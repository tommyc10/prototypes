/* The chapter captions. In the film they stack in one spot on the left of the stage and take
 * turns; in the storyboard each sits above its frame. */

import type { Chapter } from './data';
import { CHAPTERS } from './data';

export function Caption({ chapter, index }: { chapter: Chapter; index: number }) {
  return (
    <div className="cap" data-cap={chapter.id}>
      <div className="cap-meta cap-fade">
        <span className="num">{String(index + 1).padStart(2, '0')}</span>
        <span className="cap-rule" />
        {chapter.label}
      </div>
      <h2 className="cap-title">{chapter.title}</h2>
      <p className="cap-body cap-fade">{chapter.body}</p>
      {chapter.aside && <p className="cap-aside">{chapter.aside}</p>}
    </div>
  );
}

export function Captions() {
  return (
    <div className="caps">
      {CHAPTERS.map((c, i) => (
        <Caption chapter={c} index={i} key={c.id} />
      ))}
    </div>
  );
}
