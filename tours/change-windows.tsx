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
    target: 'cw-list',
    side: 'right',
    title: 'Sorted into groups',
    body: (
      <>
        Each row is a group, or a family of CI where nobody set a group, with how many windows are in place and how many
        are late. The ones with something late come first.
      </>
    ),
  },
  {
    target: 'cw-timeline',
    side: 'top',
    title: 'One group on a timeline',
    body: (
      <>
        A bar for each window, ten to a page, with a line at now. Solid is done, the lighter part is still planned, an
        outline hasn't started, and rose means it has run past its planned end. Move with <kbd>J</kbd> <kbd>K</kbd>.
      </>
    ),
  },
  {
    target: 'cw-tools',
    side: 'bottom',
    title: 'Which windows, and how much time',
    body: (
      <>
        The tabs choose what's in place, late, not started or ended. Fit stretches the timeline to the windows showing;
        24h, 3d and 7d look a fixed distance around now.
      </>
    ),
  },
  {
    target: 'cw-detail',
    side: 'left',
    title: 'One window, in full',
    body: <>Why it's there, its timeline among its neighbours, exactly what it covers, and how many alerts it has held back.</>,
  },
];
