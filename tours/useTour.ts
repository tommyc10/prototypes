/* The guided tour: whether it's showing, and which step it's on.
 * It starts by itself the first time someone opens the page; after that, only when asked
 * (the help button, ⌘K, or ?). */

import { useEffect, useState } from 'react';

const SEEN = 'mn-tour-seen';

export function useTour(
  stepCount: number,
  /** `auto: false` for a tour that only starts when asked. `seenKey` keeps each page's first visit apart. */
  { auto = true, seenKey = SEEN }: { auto?: boolean; seenKey?: string } = {},
) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const start = () => {
    setIndex(0);
    setOpen(true);
  };

  // First visit: wait for the page to settle, then start.
  useEffect(() => {
    if (!auto || localStorage.getItem(seenKey)) return;
    const timer = setTimeout(start, 600);
    return () => clearTimeout(timer);
  }, []);

  return {
    open,
    index,
    start,
    go: (i: number) => setIndex(Math.min(stepCount - 1, Math.max(0, i))),
    finish() {
      setOpen(false);
      localStorage.setItem(seenKey, '1');
    },
  };
}

export type Tour = ReturnType<typeof useTour>;
