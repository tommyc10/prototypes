/* The chapter the reader is in, and jumping to another one.
 * The report scrolls inside its own pane, so this watches that pane, not the window. */

import { useEffect, useRef, useState, type RefObject } from 'react';
import { CHAPTERS, type ChapterId } from '../model/labels';

/** Room for the sticky bar above a chapter's heading. */
const BAR = 64;

export function useChapters(scrollRef: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState<ChapterId>(CHAPTERS[0].id);
  const [scrolled, setScrolled] = useState(false);
  // While a jump is gliding there, the tab that was pressed stays lit instead of flickering through the ones in between.
  const jumping = useRef(0);

  useEffect(() => {
    const pane = scrollRef.current;
    if (!pane) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      setScrolled(pane.scrollTop > 4);
      if (Date.now() < jumping.current) return;
      // At the very bottom the last chapter wins, even if it's too short to reach the top.
      const atEnd = pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 2;
      let current: ChapterId = CHAPTERS[0].id;
      for (const { id } of CHAPTERS) {
        const el = pane.querySelector<HTMLElement>(`#${id}`);
        if (el && el.offsetTop - BAR - 24 <= pane.scrollTop) current = id;
      }
      setActive(atEnd ? CHAPTERS[CHAPTERS.length - 1].id : current);
    };
    const onScroll = () => (frame ||= requestAnimationFrame(read));
    pane.addEventListener('scroll', onScroll, { passive: true });
    read();
    return () => {
      pane.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [scrollRef]);

  /** Go to a chapter. A click glides there; a key press jumps (keyboard actions never animate). */
  const jump = (id: ChapterId, via: 'key' | 'pointer') => {
    const pane = scrollRef.current;
    const el = pane?.querySelector<HTMLElement>(`#${id}`);
    if (!pane || !el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smooth = via === 'pointer' && !reduce;
    jumping.current = Date.now() + (smooth ? 700 : 0);
    setActive(id);
    pane.scrollTo({ top: id === CHAPTERS[0].id ? 0 : el.offsetTop - BAR, behavior: smooth ? 'smooth' : 'auto' });
  };

  return { active, scrolled, jump };
}
