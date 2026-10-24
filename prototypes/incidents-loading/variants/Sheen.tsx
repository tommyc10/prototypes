/* Sheen: one band of light crosses the whole page, left to right, every 2.4s. Every shape
 * and every waiting row carries a slice of the same band, positioned by where it sits on
 * screen, so the light passes over the list and then on into the pane as a single sweep,
 * never two shimmers out of step. The band itself is a transform, so it stays smooth. */

import { placeholderVariant } from './placeholders';

export const sheen = placeholderVariant({
  name: 'Sheen',
  idea: 'One band of light crosses the list and the pane together',
  className: 'ld-sheen',
  period: 2400,
});
