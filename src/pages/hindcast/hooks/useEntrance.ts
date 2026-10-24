/* Whether a page's grid draws itself in, as the value of its data-animate attribute (see the
 * entrance in components/charts/charts.css):
 *
 *   'story'  the full draw: panels rise, bars grow, lines are drawn. Once per load of the app,
 *            on whichever of the hindcast and forecast is opened first.
 *   null     everything else. Moving between the two pages shows the other at once; changing
 *            the scope keeps every panel where it is and morphs the figures (hooks/useTween),
 *            so nothing flashes and nothing redraws from empty.
 *
 * It's one-shot: once the story has played it clears, so nothing that mounts later animates. */

import { useEffect, useState } from 'react';

export type Entrance = 'story' | null;

/** Set once the story has played in this load of the app. */
let told = false;

export function useEntrance(allowed = true) {
  const [motion, setMotion] = useState<Entrance>(() => (allowed && !told ? 'story' : null));
  useEffect(() => {
    if (!motion) return;
    told = true;
    // The story's last mark lands at 1480ms.
    const t = setTimeout(() => setMotion(null), 1600);
    return () => clearTimeout(t);
  }, [motion]);
  return motion;
}
