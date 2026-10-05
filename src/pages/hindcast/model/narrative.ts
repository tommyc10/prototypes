/* The page's prose: the headline, the lead's claim and the findings.
 *
 * Every sentence is written from the report's own figures, never typed by hand, so the words
 * can't drift from the numbers beside them. The real backend does this on the server and
 * sends the finished strings; **double asterisks** mark the figures (see common/Prose.tsx). */

import { num, pct } from '../../../lib/format';
import { caught, share, total } from './labels';
import type { Classification, ProposedValidation, RuleContribution, Scope, ServiceRow, Split } from './types';

const b = (text: string | number) => `**${typeof text === 'number' ? num(text) : text}**`;

/** 1 → "1st", 2 → "2nd"… */
const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : Math.min(n % 10, 4) % 4]}`;

/** ["a", "b", "c"] → "a, b and c" */
const list = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

export function headline(scope: Scope, name: string, tickets: number, split: Split) {
  const cancelled = total(split);
  const got = caught(split);
  const opening =
    scope.serviceId === 'all'
      ? `Over the last ${b(`${scope.weeks} completed weeks`)}, operators cancelled ${b(cancelled)} of ${num(tickets)} tickets by hand.`
      : `Over the last ${b(`${scope.weeks} completed weeks`)}, ${name} had ${b(cancelled)} of its ${num(tickets)} tickets cancelled by hand.`;
  if (!cancelled) return `${opening} There is nothing to replay.`;

  const by =
    split.rule && split.window
      ? `${b(split.rule)} caught by an active rule and ${b(split.window)} by a change window`
      : split.rule
        ? 'every one caught by an active rule'
        : 'every one caught by a change window';
  const replay = got
    ? `Replayed against the suppression logic that is live today, ${b(got)} of them would never have reached a person: ${by}.`
    : 'Replayed against the suppression logic that is live today, none of them would have been caught.';
  const rest = !got
    ? ''
    : split.missed
      ? ` The other ${b(split.missed)} would still have been raised.`
      : ' Nothing would have slipped through.';
  return `${opening} ${replay}${rest}`;
}

/** The claim about one service: how much of the noise is its, and what would have caught it. */
export function leadClaim(
  service: ServiceRow,
  rank: number,
  allCancelled: number,
  topRule: RuleContribution | undefined,
  topProposal: ProposedValidation | undefined,
) {
  const got = caught(service.split);
  const size =
    rank === 1
      ? `${b(service.name)} raised ${b(service.cancelled)} of the ${num(allCancelled)} manual cancellations, ${b(pct(share(service.cancelled, allCancelled)))} of the total and more than any other service.`
      : `${b(service.name)} is the ${b(ordinal(rank))} largest source of manual cancellations: ${b(service.cancelled)} of ${num(allCancelled)}, or ${b(pct(share(service.cancelled, allCancelled)))}.`;
  const kept = !got
    ? ' Today’s logic would not have caught any of them.'
    : topRule
      ? ` ${b(got)} would have been caught, ${b(topRule.caught)} of them by ${topRule.ruleId} alone.`
      : ` ${b(got)} would have been caught, all by change windows.`;
  const lost = !service.split.missed
    ? ''
    : topProposal && topProposal.wouldCatch
      ? ` Of the ${b(service.split.missed)} that would not, ${b(topProposal.wouldCatch)} match ${topProposal.ruleId}, which is still proposed.`
      : ` ${b(service.split.missed)} would not, and no proposed rule covers them.`;
  return `${size}${kept}${lost}`;
}

/** What this tells us: concentration, mechanism, the gap, and the cost. */
export function findings(
  scope: Scope,
  services: ServiceRow[],
  split: Split,
  rules: RuleContribution[],
  proposed: ProposedValidation[],
  classification: Classification,
) {
  const cancelled = total(split);
  if (!cancelled) return [];
  const out: string[] = [];

  // 1. Where it concentrates.
  if (scope.serviceId === 'all') {
    const top = services.slice(0, 3);
    const all = services.reduce((n, s) => n + s.cancelled, 0);
    const theirs = top.reduce((n, s) => n + s.cancelled, 0);
    out.push(
      `The noise is concentrated. ${b(`${top.length} of ${services.length} services`)} raise ${b(pct(share(theirs, all)))} of it: ${list(top.map((s) => s.name))}.`,
    );
  } else if (rules[0]) {
    out.push(
      `One pattern dominates. ${b(rules[0].ruleId)} alone accounts for ${b(pct(share(rules[0].caught, cancelled)))} of this service’s manual cancellations.`,
    );
  } else {
    out.push(`No active rule matches this service. Everything caught here is caught by a change window, or not at all.`);
  }

  // 2. What does the catching.
  const [first, second] =
    split.rule >= split.window
      ? [`${b(pct(share(split.rule, cancelled)))} of cancellations match an active rule`, `change windows add ${b(pct(share(split.window, cancelled)))}`]
      : [`${b(pct(share(split.window, cancelled)))} of cancellations fall inside a change window`, `active rules add ${b(pct(share(split.rule, cancelled)))}`];
  out.push(`${split.rule >= split.window ? 'Rules' : 'Change windows'} do most of the catching: ${first}, and ${second}.`);

  // 3. How much of what is missed is already understood.
  const pending = proposed.reduce((n, p) => n + p.wouldCatch, 0);
  const safe = proposed.filter((p) => p.verdict === 'validated').length;
  if (split.missed) {
    out.push(
      pending
        ? `Much of what slips through is already understood. ${b(pending)} of the ${b(split.missed)} uncaught tickets match a rule that is proposed but not yet approved, and ${b(`${safe} of those ${proposed.length} ${plural(proposed.length, 'rule')}`)} ${safe === 1 ? 'validates' : 'validate'} cleanly.`
        : `What slips through has no rule waiting for it: none of the ${b(split.missed)} uncaught tickets match a proposed rule.`,
    );
  }

  // 4. What it would have cost.
  const hiddenWork = classification.worked.rule + classification.worked.window;
  const allWorked = hiddenWork + classification.worked.passed;
  const hiddenEscalations = classification.escalated.rule + classification.escalated.window;
  const escalations = hiddenEscalations
    ? `${b(hiddenEscalations)} escalated ${plural(hiddenEscalations, 'ticket')} would have been hidden`
    : `${b('no escalated ticket')} would have been hidden`;
  out.push(
    hiddenWork
      ? `The cost is small but not zero. ${b(hiddenWork)} minor ${plural(hiddenWork, 'ticket')} that people did work would have been suppressed too (${pct2(share(hiddenWork, allWorked))} of worked tickets), and ${escalations}.`
      : `It would have cost nothing. No ticket that people worked would have been suppressed, and ${escalations}.`,
  );
  return out;
}

/** Small shares need a decimal: 0.004 → "0.4%". */
export const pct2 = (n: number) => (n > 0 && n < 0.095 ? `${(n * 100).toFixed(1)}%` : pct(n));
