/* The incidents page's tour: what it says, in order. Each step points at an element marked
 * `data-tour="…"` in src/pages/incidents; a step with no target is a centred card over the
 * whole (blurred) page. Same engine as the other tours (Tour.tsx); only the words differ. */

import type { TourStep } from './Tour';

export const INCIDENTS_TOUR: TourStep[] = [
  {
    title: 'Every incident has a journey',
    body: (
      <>
        Each one meets the same checkpoints in the same order. Most are stopped at one of them, because they're noise. The
        ones that aren't go to the Imperial Ops team, who enrich the ticket before its owner sees it.
      </>
    ),
  },
  {
    target: 'ic-search',
    side: 'right',
    title: 'Find one',
    body: (
      <>
        Search by number, title, CI, rule or group. The tabs keep one kind of ending. Move with <kbd>J</kbd> <kbd>K</kbd>.
      </>
    ),
  },
  {
    target: 'ic-head',
    side: 'bottom',
    title: 'The verdict first',
    body: <>What became of it, in one sentence. Red means a real incident was suppressed, which is the thing a rule must never do.</>,
  },
  {
    target: 'ic-journey',
    side: 'bottom',
    title: 'How far it got',
    body: (
      <>
        The line is lit as far as the incident travelled, and the checkpoint where it ended is drawn large. The small
        figures on the line are how long each step took. Press a checkpoint to jump to it.
      </>
    ),
  },
  {
    target: 'ic-stages',
    side: 'top',
    title: 'Why, at each checkpoint',
    body: <>The evidence for each decision: the rule's conditions beside this incident's values, and the ticket before and after the team enriched it.</>,
  },
];
