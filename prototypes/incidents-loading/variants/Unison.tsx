/* Unison: the quietest of the three. Every shape and every waiting row breathes on one
 * clock, so the list and the pane rise and fall together; shapes that appear later join the
 * beat already running instead of starting their own. Opacity only. */

import { placeholderVariant } from './placeholders';

export const unison = placeholderVariant({
  name: 'Unison',
  idea: 'Both columns breathe in step, on one shared clock',
  className: 'ld-unison',
  period: 1800,
});
