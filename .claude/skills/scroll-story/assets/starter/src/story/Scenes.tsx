/* Every scene, in stage order (later ones paint on top). Memoised: the film re-renders
 * when the active chapter changes, and none of that concerns the scenes. */

import { memo } from 'react';
import { Hero } from './scenes/Hero';
import { Outro } from './scenes/Outro';
import { Pattern } from './scenes/Pattern';
import { Ticket } from './scenes/Ticket';
import { Wall } from './scenes/Wall';
import './scenes/HeroOutro.css';

export const Scenes = memo(function Scenes({ onReplay }: { onReplay: () => void }) {
  return (
    <>
      <Wall />
      <Hero />
      <Ticket />
      <Pattern />
      <Outro onReplay={onReplay} />
    </>
  );
});
