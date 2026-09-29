/* The detail pane picks its layout from its own width, not the window's,
 * because the sidebar and list next to it can be shown or hidden. */

import { useLayoutEffect, useRef, useState } from 'react';

export type PaneMode = 'narrow' | 'wide' | 'ultra';

export function usePaneMode() {
  const ref = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<PaneMode>('narrow');
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pick = (width: number) => setMode(width >= 1700 ? 'ultra' : width >= 1100 ? 'wide' : 'narrow');
    const observer = new ResizeObserver(([entry]) => pick(entry.contentRect.width));
    observer.observe(el);
    pick(el.getBoundingClientRect().width); // measure once straight away
    return () => observer.disconnect();
  }, []);
  return [ref, mode] as const;
}
