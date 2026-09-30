/* Fly is the default story. ?d=zoom | snap | fly selects an alternative explicitly. */

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { fly } from './directions/fly';
import { snap } from './directions/snap';
import { zoom } from './directions/zoom';
import { Board } from './shared/Board';
import { Film } from './shared/Film';
import { Picker } from './shared/Picker';

const DIRECTIONS = [zoom, snap, fly];
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
  const id = new URLSearchParams(location.search).get('d');
  const d = DIRECTIONS.find((x) => x.id === id) ?? fly;

  useLayoutEffect(() => {
    document.title = `Midnight · ${d.name}`;
    if (!film) return;
    history.scrollRestoration = 'manual';
    scrollTo(0, 0);
  }, [film, d]);

  return (
    <>
      {film ? <Film d={d} key={d.id} /> : <Board d={d} />}
      <Picker directions={DIRECTIONS} current={d.id} />
    </>
  );
}
