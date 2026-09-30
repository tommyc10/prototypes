/* The story without the film, for small screens and reduced motion: each chapter's caption
 * above a still of its scene. The scenes are drawn in their end state, so the stills are free. */

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { Box } from '../lib/geometry';
import { Caption } from './Captions';
import { CHAPTERS, PRODUCT } from './data';
import { Pattern } from './scenes/Pattern';
import { Ticket } from './scenes/Ticket';

/** Which chapters share a still, and which part of the 1440 × 900 stage it shows. */
const STILLS: { chapters: string[]; crop: Box; scene: ReactNode }[] = [
  { chapters: ['ticket'], crop: { x: 640, y: 180, w: 640, h: 440 }, scene: <Ticket /> },
  { chapters: ['pattern'], crop: { x: 570, y: 160, w: 800, h: 460 }, scene: <Pattern /> },
];

export function Storyboard() {
  return (
    <main className="board">
      <header className="board-hero">
        <div className="hero-eyebrow">
          <span className="dot" data-s="open" />
          {PRODUCT.name} · the story
        </div>
        <h1 className="board-title">
          Every ticket asks for someone. <span className="hero-title-2">Most shouldn’t have to.</span>
        </h1>
      </header>

      {STILLS.map((still) => (
        <section className="board-ch" key={still.chapters[0]}>
          {still.chapters.map((id) => {
            const i = CHAPTERS.findIndex((c) => c.id === id);
            return <Caption chapter={CHAPTERS[i]} index={i} key={id} />;
          })}
          <Frame crop={still.crop}>{still.scene}</Frame>
        </section>
      ))}

      <footer className="board-outro">
        <h2 className="board-title">Quiet, on purpose.</h2>
        <a className="btn" data-variant="primary" href={PRODUCT.url} style={{ marginTop: 32 }}>
          Try {PRODUCT.name} ↗
        </a>
      </footer>
    </main>
  );
}

/** A window onto part of the stage, scaled to the frame's width. */
function Frame({ crop, children }: { crop: Box; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current!;
    const fit = () => el.style.setProperty('--k', String(el.clientWidth / crop.w));
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [crop.w]);
  return (
    <div className="frame" ref={ref} style={{ aspectRatio: `${crop.w} / ${crop.h}` }} aria-hidden>
      <div className="frame-stage" style={{ transform: `scale(var(--k)) translate(${-crop.x}px, ${-crop.y}px)` }}>
        {children}
      </div>
    </div>
  );
}
