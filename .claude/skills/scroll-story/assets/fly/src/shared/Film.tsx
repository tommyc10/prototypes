/* The film, shared by every direction: a pinned, fixed-size stage whose one timeline is
 * scrubbed by the scroll bar. The direction supplies the stage, the chrome and the timeline. */

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { STAGE_H, STAGE_W } from '../lib/geometry';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import type { Mark } from '../lib/kit';
import { CHAPTERS } from './story';
import type { Direction } from './types';

/** Scroll per second of timeline, in window heights. */
const SCROLL_PER_SECOND = 0.26;
/** How far into a chapter a rail jump lands, so it arrives on a settled frame. */
const SETTLE = 1.8;

export function Film({ d }: { d: Direction }) {
  const root = useRef<HTMLDivElement>(null);
  const fills = useRef<(HTMLElement | null)[]>([]);
  const nav = useRef<{ st: ScrollTrigger; marks: Mark[]; duration: number } | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [active, setActive] = useState(-1);

  useLayoutEffect(() => {
    const fit = () => root.current?.style.setProperty('--stage-scale', String(Math.min(innerWidth / STAGE_W, innerHeight / STAGE_H)));
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  useGSAP(
    () => {
      if (!fontsReady) return;
      const film = root.current!;
      const built = d.build(film.querySelector<HTMLElement>('.stage')!);
      const { tl, marks } = built.story;

      let current = -1;
      tl.eventCallback('onUpdate', () => {
        const time = tl.time();
        let now = -1;
        marks.forEach((m, i) => {
          fills.current[i]?.style.setProperty('--p', String(gsap.utils.clamp(0, 1, (time - m.start) / (m.end - m.start))));
          if (time >= m.start && time < m.end) now = i;
        });
        if (now !== current) setActive((current = now));
        built.onUpdate?.(time);
      });

      // Snapping directions rest only on settled moments: the start, each chapter just before
      // it hands over, and the end. One flick of the wheel plays the next beat through.
      const d_ = tl.duration();
      const rests = [0, ...marks.map((m) => (m.end - 0.25) / d_), 1];
      const st = ScrollTrigger.create({
        trigger: film.querySelector('.film-pin'),
        start: 'top top',
        end: () => `+=${tl.duration() * innerHeight * SCROLL_PER_SECOND}`,
        pin: true,
        scrub: 1,
        animation: tl,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // ?nosnap turns snapping off, for seeking to exact times while testing.
        snap: d.snap && !new URLSearchParams(location.search).has('nosnap')
          ? {
              snapTo: (v: number, self?: ScrollTrigger) => ScrollTrigger.snapDirectional(rests)(v, self?.direction ?? 1),
              duration: { min: 0.8, max: 2.4 },
              delay: 0.08,
              ease: 'power1.inOut',
            }
          : undefined,
      });
      nav.current = { st, marks, duration: tl.duration() };
      built.onUpdate?.(0);
      film.dataset.ready = '';
      if (import.meta.env.DEV) Object.assign(window, { __film: { tl, st, marks } });
      if (scrollY < 4) built.intro?.();
    },
    { scope: root, dependencies: [fontsReady] },
  );

  const scrollToTime = useCallback((time: number, duration: number) => {
    const n = nav.current;
    if (!n) return;
    gsap.to(window, { scrollTo: n.st.start + (n.st.end - n.st.start) * (time / n.duration), duration, ease: 'story-in-out' });
  }, []);
  const replay = useCallback(() => scrollToTime(0, 2.6), [scrollToTime]);
  const jump = useCallback(
    (i: number) => {
      const m = nav.current?.marks[i];
      if (m) scrollToTime(m.start + SETTLE, 1.4);
    },
    [scrollToTime],
  );

  const { Chrome } = d;
  return (
    <div className={`film ${d.className}`} ref={root}>
      <div className="film-pin">
        <div className="stage">
          <MemoStage Stage={d.Stage} onReplay={replay} />
        </div>
        <Chrome chapters={CHAPTERS} active={active} fills={fills} onJump={jump} />
      </div>
    </div>
  );
}

/** The scenes never need to re-render when the active chapter changes. */
const MemoStage = memo(function MemoStage({ Stage, onReplay }: { Stage: Direction['Stage']; onReplay: () => void }) {
  return <Stage onReplay={onReplay} />;
});
