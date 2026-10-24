/* Wave: a ripple runs from the top of the list to the far corner of the pane. Each shape
 * brightens a moment after the one up and to the left of it, timed by where it sits on
 * screen, so the wave reads as one thing travelling across both columns. Opacity only. */

import { placeholderVariant } from './placeholders';

export const wave = placeholderVariant({
  name: 'Wave',
  idea: 'A ripple runs diagonally from the list into the pane',
  className: 'ld-wave',
  period: 2600,
});
