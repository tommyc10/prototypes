/* How a page's grid arrives, as the value of its data-animate attribute (see the entrance in
 * components/charts/charts.css):
 *
 *   'story'  the full draw: the page has just opened
 *   'swap'   a quick fade: the reader changed the scope with the pointer, or followed a link
 *            from the other page and is mid-task
 *   null     nothing: a key press, ⌘K, and anything after the motion has played
 *
 * It's one-shot: once its motion has played it clears, so nothing that mounts later animates.
 * `gridKey` is whatever the grid is keyed on; a new key starts the clock again. */

import { useEffect, useState } from 'react';

export type Entrance = 'story' | 'swap' | null;

export function useEntrance(gridKey: string, first: Entrance) {
  const [motion, setMotion] = useState<Entrance>(first);
  useEffect(() => {
    if (!motion) return;
    // The story's last mark lands at 1480ms; the swap is 180ms.
    const t = setTimeout(() => setMotion(null), motion === 'story' ? 1600 : 400);
    return () => clearTimeout(t);
  }, [gridKey, motion]);
  return [motion, setMotion] as const;
}
