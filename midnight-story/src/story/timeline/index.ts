/* The whole film as one timeline. Chapters run in order; each picks up where the last left off. */

import { gsap } from '../../lib/gsap';
import { CHAPTERS } from '../data';
import { createStory, prepareCaption } from './kit';
import { audit, guardrail, outro, suppression } from './closing';
import { decision, pattern, rule } from './middle';
import { hero, recurrence, ticket } from './opening';

export function buildStory(stage: HTMLElement) {
  const s = createStory(stage);

  // Only the wall and the headline are on screen at the start.
  gsap.set(stage.querySelectorAll('.scene:not(.sc-wall):not(.sc-hero)'), { autoAlpha: 0 });
  CHAPTERS.forEach((c) => prepareCaption(s, c.id));

  hero(s);
  ticket(s);
  recurrence(s);
  pattern(s);
  rule(s);
  decision(s);
  suppression(s);
  guardrail(s);
  audit(s);
  outro(s);

  return s;
}
