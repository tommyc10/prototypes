/* Small screens and reduced motion: the story as text, in the direction's colours. The film's
 * scroll-linked camera is exactly what reduced motion asks us not to do. */

import { CHAPTERS, HEADLINE, OUTRO, SUB } from './story';
import type { Direction } from './types';

export function Board({ d }: { d: Direction }) {
  return (
    <main className={`board ${d.className}`}>
      <p className="board-kicker">Midnight · {d.name}</p>
      <h1 className="board-title">
        {HEADLINE.a} <em>{HEADLINE.b}</em>
      </h1>
      <p className="board-sub">{SUB}</p>
      {CHAPTERS.map((c, i) => (
        <section className="board-ch" key={c.id}>
          <p className="board-kicker">
            {String(i + 1).padStart(2, '0')} · {c.label}
          </p>
          <h2>{c.title}</h2>
          <p>{c.body}</p>
        </section>
      ))}
      <h2 className="board-title">{OUTRO.title}</h2>
      <p className="board-sub">{OUTRO.sub}</p>
      <p className="board-note">Open this on a larger screen, with motion allowed, to see the film.</p>
    </main>
  );
}
