/* The rule management page's tour: what it says, in order. Each step points at an element
 * marked `data-tour="…"` in src/; a step with no target is a centred card over the whole
 * (blurred) page. `side` is where the card would like to sit; it moves if there isn't room.
 *
 * To tour another page, write a file like this one and mark that page's elements. */

import type { TourStep } from './Tour';

export interface RuleTourStep extends TourStep {
  /** Open a decision on the selected rule for this step, so the form can be shown. */
  showsDecision?: boolean;
}

export const TOUR_STEPS: RuleTourStep[] = [
  {
    title: 'Welcome to Rule management',
    body: (
      <>
        The rule engine watches the incident stream and proposes rules that quietly suppress the noise. Nothing is
        suppressed until a person approves it. That person is you. This takes about a minute.
      </>
    ),
  },
  {
    target: 'groups',
    side: 'bottom',
    title: 'Start with your groups',
    body: (
      <>
        Every rule is locked to one assignment group. Open this to find a group or service by name; the ones with
        rules waiting on a decision come first. Pin the few you use to keep them in the sidebar.
      </>
    ),
  },
  {
    target: 'list-tools',
    side: 'right',
    title: 'Find the rules that need you',
    body: (
      <>
        Search rules, CIs and sources with <kbd>/</kbd>. The tabs split proposed rules from active and inactive ones,
        and you can sort by confidence or volume.
      </>
    ),
  },
  {
    target: 'rows',
    side: 'right',
    title: 'The queue',
    body: (
      <>
        Move with <kbd>J</kbd> <kbd>K</kbd>. Confidence under 60% turns orange: those rules might hide something real.
        The selected rule opens on the right.
      </>
    ),
  },
  {
    target: 'stats',
    side: 'bottom',
    title: 'Read the numbers first',
    body: (
      <>
        Confidence is how sure the engine is. Purity is how many matches were truly noise. Escalated counts real
        incidents the rule would have hidden, and you want that at zero.
      </>
    ),
  },
  {
    target: 'evidence',
    side: 'left',
    title: 'Why it was proposed',
    body: (
      <>
        The conditions read like code, so you can see exactly what gets matched. The last line is the scope: a rule can
        never reach outside its group.
      </>
    ),
  },
  {
    target: 'decision',
    side: 'left',
    title: 'Make the call',
    body: (
      <>
        Approve, reject, activate or deactivate. Each has one key: <kbd>A</kbd> <kbd>X</kbd> <kbd>E</kbd> <kbd>D</kbd>.
      </>
    ),
  },
  {
    target: 'composer',
    side: 'left',
    showsDecision: true,
    title: 'Every change needs a reason',
    body: (
      <>
        Write what you checked. It goes to the audit log with your name. Approving backtests the last 90 days first, and
        anything under 60% confidence also needs a hold-to-override.
      </>
    ),
  },
  {
    target: 'jump',
    side: 'right',
    title: 'Everything is a keystroke away',
    body: (
      <>
        <kbd>⌘K</kbd> jumps to any rule, filter, group or action. <kbd>[</kbd> and <kbd>]</kbd> tuck the sidebar and
        list away when you need room.
      </>
    ),
  },
  {
    title: "You're cleared for duty, Admiral",
    body: (
      <>
        Replay this tour any time with <kbd>?</kbd>, or from the help button next to your name.
      </>
    ),
  },
];
