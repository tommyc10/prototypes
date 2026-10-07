/* The alerts page's tour: what it says, in order. Each step points at an element marked
 * `data-tour="…"` in src/pages/alerts; a step with no target is a centred card over the
 * whole (blurred) page. Same engine as the other tours (Tour.tsx); only the words differ. */

import type { TourStep } from './Tour';

export const ALERTS_TOUR: TourStep[] = [
  {
    title: 'This is the stream',
    body: (
      <>
        Every alert the monitors send, as it arrives, and what became of it. Most are hidden by a rule or folded into an
        incident that's already open. A few reach a person.
      </>
    ),
  },
  {
    target: 'al-water',
    side: 'bottom',
    title: 'One dot is one alert',
    body: (
      <>
        Above the line, a person saw it. Below the line, a rule hid it. Time runs left to right, and new alerts arrive at
        the right edge. Drag across the chart, or press <kbd>←</kbd> <kbd>→</kbd>, to rewind the last hour.
      </>
    ),
  },
  {
    target: 'al-preview',
    side: 'bottom',
    title: 'Try the proposed rules first',
    body: (
      <>
        Press <kbd>P</kbd> and the alerts the proposed rules would hide sink below the line as rings. A red ring opened an
        incident: that's a page that would stop arriving. See it here before you approve anything.
      </>
    ),
  },
  {
    target: 'al-feed',
    side: 'right',
    title: 'The same alerts, as a list',
    body: (
      <>
        Search it, or keep only what reached a person. Move with <kbd>J</kbd> <kbd>K</kbd>. Picking a row marks its dot on
        the chart, and picking a dot finds its row.
      </>
    ),
  },
  {
    target: 'al-trace',
    side: 'top',
    title: 'What happened to this one',
    body: <>Where it came from, which rule it fits, and where it ended up. With nothing picked, it follows the latest alert to reach a person.</>,
  },
  {
    target: 'al-rules',
    side: 'top',
    title: 'The rules doing the work',
    body: <>Point at a rule to light up its alerts on the chart. Press it to narrow the list to them, or open it to make a decision.</>,
  },
];
