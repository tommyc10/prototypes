/* The story without the film, for small screens and reduced motion: each chapter's caption
 * above a still of its scene, drawn in its finished state. Nothing moves on scroll. */

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Box } from '../lib/geometry';
import { Caption } from './Captions';
import { BotAvatar } from '../vendor/bot-avatars';
import { CHAPTERS, DASHBOARD_URL, GUIDE, LINES, OUTRO_STATS } from './data';
import { Audit } from './scenes/Audit';
import { Gate } from './scenes/Gate';
import { Pattern } from './scenes/Pattern';
import { Recurrence } from './scenes/Recurrence';
import { GuardScene, RuleScene } from './scenes/RulePage';
import { Ticket } from './scenes/Ticket';

/** Which chapters share a still, and which part of the stage the still shows. */
const STILLS: { chapters: string[]; crop: Box; scene: ReactNode }[] = [
  { chapters: ['ticket'], crop: { x: 640, y: 150, w: 660, h: 500 }, scene: <Ticket /> },
  { chapters: ['recurrence'], crop: { x: 570, y: 120, w: 800, h: 640 }, scene: <Recurrence /> },
  { chapters: ['pattern'], crop: { x: 540, y: 190, w: 890, h: 440 }, scene: <Pattern /> },
  { chapters: ['rule', 'decision'], crop: { x: 480, y: 60, w: 940, h: 780 }, scene: <RuleScene /> },
  { chapters: ['suppression'], crop: { x: 540, y: 96, w: 880, h: 650 }, scene: <Gate /> },
  { chapters: ['guardrail'], crop: { x: 480, y: 60, w: 940, h: 780 }, scene: <GuardScene /> },
  { chapters: ['audit'], crop: { x: 556, y: 112, w: 820, h: 700 }, scene: <Audit /> },
];

export function Storyboard() {
  return (
    <main className="board">
      <header className="board-hero">
        <div className="hero-eyebrow">
          <span className="dot" data-s="open" />
          Midnight · rule governance for Imperial Ops
        </div>
        <h1 className="board-title">
          Silence the noise. <span className="hero-title-2">Never the signal.</span>
        </h1>
        <p className="board-sub">
          Follow one alert from the second it fires to the rule that retires it, and meet the person who signs for it.
        </p>
      </header>

      {STILLS.map((still) => (
        <section className="board-ch" key={still.chapters[0]}>
          {still.chapters.map((id) => {
            const i = CHAPTERS.findIndex((c) => c.id === id);
            return <Caption chapter={CHAPTERS[i]} index={i} key={id} />;
          })}
          {still.chapters.map((id) => LINES.find((l) => l.scene === id && l.board)).map(
            (line) =>
              line && (
                <p className="board-pip" key={line.text}>
                  <BotAvatar type={GUIDE.type} size={40} interactive={false} jumpEvery={0} aria-hidden />
                  <span>{line.text}</span>
                </p>
              ),
          )}
          <Frame crop={still.crop}>{still.scene}</Frame>
        </section>
      ))}

      <footer className="board-outro">
        <BotAvatar type={GUIDE.type} size={56} state="sleeping" interactive={false} aria-label={`${GUIDE.name} the dragon, asleep`} />
        <h2 className="board-title">Quiet, on purpose.</h2>
        <dl className="outro-stats">
          {OUTRO_STATS.map((s) => (
            <div className="outro-stat" key={s.label}>
              <dt>
                {s.value}
                {s.suffix}
              </dt>
              <dd>{s.label}</dd>
            </div>
          ))}
        </dl>
        <a className="btn" data-variant="primary" href={DASHBOARD_URL}>
          Open the dashboard
          <ArrowUpRight size={15} strokeWidth={2} />
        </a>
      </footer>
    </main>
  );
}

/** A window onto part of the 1440 × 900 stage, scaled to the frame's width. */
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
