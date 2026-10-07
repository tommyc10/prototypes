/* The change windows page's tour: what it says, in order. Each step points at an element
 * marked `data-tour="…"` in src/pages/change-windows; a step with no target is a centred
 * card over the whole (blurred) page. Same engine as the other tours (Tour.tsx). */

import type { TourStep } from './Tour';

export const WINDOWS_TOUR: TourStep[] = [
  {
    title: 'These are the change windows',
    body: (
      <>
        A change window is a stretch of planned work. While one is in place, alerts from the things it covers are held
        back, because the work is expected to set them off.
      </>
    ),
  },
  {
    target: 'cw-schedule',
    side: 'bottom',
    title: 'Everything on one timeline',
    body: (
      <>
        A row for each group and a bar for each window, with a line at now. Solid is in place, an outline is still to come,
        and an orange tail means it has run past its planned end.
      </>
    ),
  },
  {
    target: 'cw-range',
    side: 'bottom',
    title: 'Look further ahead',
    body: <>The schedule shows 24 hours, three days or a week. A quarter of it is behind now, the rest ahead.</>,
  },
  {
    target: 'cw-list',
    side: 'right',
    title: 'What needs watching, first',
    body: (
      <>
        Overrunning windows lead the list, then whatever ends soonest. Move with <kbd>J</kbd> <kbd>K</kbd>, and use the
        tabs for what's coming up or already over.
      </>
    ),
  },
  {
    target: 'cw-detail',
    side: 'top',
    title: 'One window, in full',
    body: <>Why it's there, how far through it is, exactly what it covers, and how many alerts it has held back so far.</>,
  },
];
