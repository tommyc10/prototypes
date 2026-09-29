/* Every scene, in stage order (later ones paint on top). */

import { Audit } from './scenes/Audit';
import { Gate } from './scenes/Gate';
import { Hero } from './scenes/Hero';
import { Outro } from './scenes/Outro';
import { Pattern } from './scenes/Pattern';
import { Recurrence } from './scenes/Recurrence';
import { GuardScene, RuleScene } from './scenes/RulePage';
import { Ticket } from './scenes/Ticket';
import { Wall } from './scenes/Wall';
import './scenes/HeroOutro.css';

export function Scenes({ onReplay }: { onReplay: () => void }) {
  return (
    <>
      <Wall />
      <Hero />
      <Ticket />
      <Recurrence />
      <Pattern />
      <RuleScene />
      <Gate />
      <GuardScene />
      <Audit />
      <Outro onReplay={onReplay} />
    </>
  );
}
