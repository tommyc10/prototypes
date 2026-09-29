/* The film: a pinned, fixed-size stage whose one timeline is scrubbed by the scroll bar. */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../lib/gsap';
import { STAGE_H, STAGE_W } from '../lib/geometry';
import { Captions } from './Captions';
import { CHAPTERS } from './data';
import { Scenes } from './Scenes';
import { buildStory } from './timeline';
import type { Mark } from './timeline/kit';
import { TopBar } from './TopBar';

/** How much scrolling one second of timeline takes, in window heights. */
const SCROLL_PER_SECOND = 0.24;
/** Where a chapter "settles" after its transition, for jumping to it from the rail. */
const SETTLE = 1.8;

export function Film() {
  const root = useRef<HTMLDivElement>(null);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const nav = useRef<{ st: ScrollTrigger; marks: Mark[]; duration: number } | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [active, setActive] = useState(-1);

  // Fit the 1440 × 900 stage inside the window. Layout inside it never changes.
  useLayoutEffect(() => {
    const fit = () =>
      root.current?.style.setProperty('--stage-scale', String(Math.min(innerWidth / STAGE_W, innerHeight / STAGE_H)));
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);

  // Measure after the fonts land, or every position is a few pixels off.
  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  useGSAP(
    () => {
      if (!fontsReady) return;
      const film = root.current!;
      const s = buildStory(film.querySelector<HTMLElement>('.stage')!);
      const { marks, tl } = s;

      const rail = film.querySelector('.rail');
      gsap.set(rail, { autoAlpha: 0 });
      tl.to(rail, { autoAlpha: 1, duration: 0.4 }, marks[0].start + 0.6);
      tl.to(rail, { autoAlpha: 0, duration: 0.4 }, marks[marks.length - 1].end);

      // Progress rail: fill each chapter's segment as the playhead crosses it.
      let current = -1;
      tl.eventCallback('onUpdate', () => {
        const time = tl.time();
        let now = -1;
        marks.forEach((m, i) => {
          const p = gsap.utils.clamp(0, 1, (time - m.start) / (m.end - m.start));
          fills.current[i]?.style.setProperty('transform', `scaleX(${p})`);
          if (time >= m.start && time < m.end) now = i;
        });
        if (now !== current) setActive((current = now));
      });

      const st = ScrollTrigger.create({
        trigger: film.querySelector('.film-pin'),
        start: 'top top',
        end: () => `+=${tl.duration() * innerHeight * SCROLL_PER_SECOND}`,
        pin: true,
        scrub: 1,
        animation: tl,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
      nav.current = { st, marks, duration: tl.duration() };
      // Dev only: lets a script (or you, in the console) seek the film. `__film.tl.duration()`.
      if (import.meta.env.DEV) Object.assign(window, { __film: { tl, st, marks } });

      // First visit: the wall and headline arrive. Plays once, on its own clock.
      if (scrollY < 4) {
        const words = SplitText.create(film.querySelector<HTMLElement>('.hero-title')!, { type: 'words' });
        gsap
          .timeline({ defaults: { ease: 'mn-out' } })
          .from('.wall-col', { autoAlpha: 0, y: (i: number) => [40, 80, 56, 96][i], duration: 1.8, stagger: 0.08 }, 0)
          .from('.hero-eyebrow', { autoAlpha: 0, y: 10, duration: 0.8 }, 0.25)
          .from(words.words, { autoAlpha: 0, yPercent: 40, filter: 'blur(8px)', duration: 1.1, stagger: 0.07 }, 0.35)
          .from('.hero-sub', { autoAlpha: 0, y: 10, duration: 0.9 }, 0.9)
          .from('.hero-cue > *', { autoAlpha: 0, y: 8, duration: 0.8, stagger: 0.1 }, 1.3);
      }
    },
    { scope: root, dependencies: [fontsReady] },
  );

  const scrollToTime = (time: number, duration: number) => {
    const n = nav.current;
    if (!n) return;
    const y = n.st.start + (n.st.end - n.st.start) * (time / n.duration);
    gsap.to(window, { scrollTo: y, duration, ease: 'mn-in-out' });
  };

  const goTo = (i: number) => {
    const m = nav.current?.marks[i];
    if (m) scrollToTime(m.start + SETTLE, 1.4);
  };

  return (
    <div className="film" ref={root}>
      <div className="film-pin">
        <div className="stage">
          <Scenes onReplay={() => scrollToTime(0, 2.6)} />
          <Captions />
        </div>
        <TopBar active={active} fills={fills} onJump={goTo} chapters={CHAPTERS} />
      </div>
    </div>
  );
}
