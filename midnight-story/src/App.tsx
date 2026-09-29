/* The page: the scroll film where there's room and motion is welcome, the storyboard otherwise. */

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { Film } from './story/Film';
import { Storyboard } from './story/Storyboard';

const FILM = '(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)';

function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => matchMedia(query).matches,
  );
}

export function App() {
  const film = useMedia(FILM);

  // The film always starts at the top: it's a story, not a document to resume.
  useLayoutEffect(() => {
    if (!film) return;
    history.scrollRestoration = 'manual';
    scrollTo(0, 0);
  }, [film]);

  return film ? <Film /> : <Storyboard />;
}
