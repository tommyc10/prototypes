/* The hindcast page's tour: what it says, in order. Each step points at an element marked
 * `data-tour="…"` in src/pages/hindcast; a step with no target is a centred card over the
 * whole (blurred) page. Same engine as the Rules tour (Tour.tsx); only the words differ. */

import type { TourStep } from './Tour';

export const HINDCAST_TOUR: TourStep[] = [
  {
    title: 'This is a hindcast',
    body: (
      <>
        A replay, not a forecast. It takes the tickets people already cancelled by hand and runs them through the
        suppression logic that is live today, to show what would have been caught, and by what.
      </>
    ),
  },
  {
    target: 'hc-services',
    side: 'right',
    title: 'Start with who made the noise',
    body: (
      <>
        Every service, the noisiest first. A bar's length is its share of the manual cancellations; its three tones are
        what would have caught them. Pick one with <kbd>J</kbd> <kbd>K</kbd> and the whole report is about that service.
      </>
    ),
  },
  {
    target: 'hc-lookback',
    side: 'bottom',
    title: 'Choose how far back',
    body: <>4, 8, 12 or 26 weeks. Only completed weeks are replayed, so a half-finished week never drags the numbers down.</>,
  },
  {
    target: 'hc-headline',
    side: 'bottom',
    title: 'The verdict, in one figure',
    body: (
      <>
        The share of hand-cancelled tickets that would never have reached a person. The paragraph beside it is written
        from the report's own figures, so the words and the numbers can't disagree.
      </>
    ),
  },
  {
    target: 'hc-summary',
    side: 'bottom',
    title: 'Three tones, everywhere',
    body: (
      <>
        Caught by a rule, caught by a change window, not caught. The same three tones, in the same order, in every chart
        on the page. Colour is kept for status: proposed, validated, unsafe.
      </>
    ),
  },
  {
    target: 'hc-chapters',
    side: 'bottom',
    title: 'Five chapters, one argument',
    body: (
      <>
        The verdict, where the noise came from, what caught it, what to change, and how it was worked out. Jump with{' '}
        <kbd>1</kbd> to <kbd>5</kbd>.
      </>
    ),
  },
  {
    target: 'hc-proposed',
    side: 'top',
    title: 'Evidence for the next decision',
    body: (
      <>
        Every proposed rule, replayed as if it had been active. A row opens that rule on the Rules page, where the
        decision is made. Approve it there and these numbers move.
      </>
    ),
  },
  {
    title: 'That is the whole of it',
    body: (
      <>
        Replay this tour any time with <kbd>?</kbd>, or from the help button next to your name.
      </>
    ),
  },
];
