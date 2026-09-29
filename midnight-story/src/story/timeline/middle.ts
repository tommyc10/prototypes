/* Pattern → rule → decision: the specifics fly off the ticket and generalise into a query,
 * the query lands in the rule page, and a person approves it. */

import { gsap } from '../../lib/gsap';
import { centerOf, focus } from '../../lib/geometry';
import { CONDITIONS, RULE_0412 } from '../data';
import { type Story, all, box, captionIn, captionOut, count, enter, leave, mark, one, pointer, swap, type } from './kit';

const AMBER_ON = { backgroundColor: 'rgba(224, 169, 62, 0.16)', boxShadow: '0 0 0 3px rgba(224, 169, 62, 0.16)' };
const AMBER_OFF = { backgroundColor: 'rgba(224, 169, 62, 0)', boxShadow: '0 0 0 3px rgba(224, 169, 62, 0)' };

export function pattern(s: Story) {
  const t = s.t;
  const scene = one(s, '.sc-pat');
  const stack = one(s, '.pt-stack');
  const cells = all(s, '.rec-cell');

  captionOut(s, 'recurrence', t);

  // All 214 squares pour into one stack of tickets.
  const into = centerOf(box(s, '.pt-card'));
  const cellBoxes = cells.map((c) => box(s, c));
  s.tl.to(
    cells,
    {
      x: (i: number) => into.x - cellBoxes[i].x - 9,
      y: (i: number) => into.y - cellBoxes[i].y - 9,
      scale: 0.4,
      autoAlpha: 0,
      duration: 0.9,
      ease: 'mn-in-out',
      stagger: { amount: 0.5, from: 'end' },
    },
    t + 0.1,
  );
  s.tl.set(scene, { autoAlpha: 1 }, t + 0.3);
  enter(s, stack, t + 0.6, { y: 0, scale: 0.94, duration: 0.8 });
  enter(s, one(s, '.pt-draft'), t + 0.9, { y: 0, x: 24, duration: 0.8 });
  s.tl.set(one(s, '.sc-rec'), { autoAlpha: 0 }, t + 1.6);
  captionIn(s, 'pattern', t + 1);

  // The engine is working: the query is empty, the specifics still specific.
  gsap.set(one(s, '.pt-state-busy'), { autoAlpha: 1, filter: 'blur(0px)' });
  gsap.set(one(s, '.pt-state-done'), { autoAlpha: 0, filter: 'blur(3px)' });
  const lines = all(s, '.pt-code .code-line, .pt-code .code-cm');
  gsap.set(lines, { autoAlpha: 0, x: -6 });
  gsap.set(one(s, '.pt-draft-foot'), { autoAlpha: 0 });

  // One at a time, a value lifts off the ticket, flies into the query and generalises.
  const fields: HTMLElement[] = [];
  CONDITIONS.forEach((c, i) => {
    const at = t + 1.7 + i * 1.2;
    const field = one(s, `.pt-v[data-f="${c.from}"]`);
    const chip = one(s, `.pt-chip[data-f="${c.from}"]`);
    const val = one(s, `.pt-code .code-val[data-from="${c.from}"]`);
    const from = box(s, field);
    const to = box(s, val);
    const h = chip.offsetHeight;
    fields.push(field);

    gsap.set(val, { text: c.specific });
    gsap.set(field, AMBER_OFF);
    gsap.set(chip, { x: from.x - 6, y: from.y + from.h / 2 - h / 2, autoAlpha: 0 });

    s.tl.to(field, { ...AMBER_ON, duration: 0.3 }, at);
    s.tl.to(chip, { autoAlpha: 1, scale: 1.08, duration: 0.25 }, at + 0.2);
    // x and y on different curves, so the flight arcs a little instead of running on rails.
    s.tl.to(chip, { x: to.x - 6, duration: 0.9, ease: 'mn-in-out' }, at + 0.35);
    s.tl.to(chip, { y: to.y + to.h / 2 - h / 2, duration: 0.9, ease: 'sine.inOut' }, at + 0.35);
    s.tl.to(chip, { scale: 1, duration: 0.3 }, at + 0.95);
    s.tl.to(val.parentElement!, { autoAlpha: 1, x: 0, duration: 0.5 }, at + 0.7);
    s.tl.to(chip, { autoAlpha: 0, duration: 0.2 }, at + 1.25);
    s.tl.to(val, { scrambleText: { text: c.general, chars: '*0123456789', speed: 0.6 }, duration: 0.6, ease: 'none' }, at + 1.2);
  });

  // Scope gets locked to the owning group, and the engine files its proposal.
  const done = t + 1.7 + CONDITIONS.length * 1.2;
  s.tl.to(lines.slice(CONDITIONS.length), { autoAlpha: 1, x: 0, stagger: 0.12, duration: 0.5 }, done);
  s.tl.to(fields, { ...AMBER_OFF, duration: 0.5 }, done);
  s.tl.to(one(s, '.pt-state-busy'), { autoAlpha: 0, filter: 'blur(3px)', duration: 0.35 }, done + 0.3);
  s.tl.to(one(s, '.pt-state-done'), { autoAlpha: 1, filter: 'blur(0px)', duration: 0.35 }, done + 0.4);
  s.tl.to(one(s, '.pt-draft-foot'), { autoAlpha: 1, duration: 0.5 }, done + 0.5);

  s.t = done + 1.5;
  mark(s, 'pattern', t, s.t);
}

export function rule(s: Story) {
  const t = s.t;
  const scene = one(s, '.sc-rule');
  const win = one(s, '.sc-rule .win');
  const draft = one(s, '.pt-draft');
  const query = one(s, '.pt-code');
  const target = one(s, '.rp-code');

  captionOut(s, 'pattern', t);

  // Everything but the query steps back; the draft card dissolves around it.
  leave(s, [one(s, '.pt-stack'), one(s, '.pt-draft-head'), one(s, '.pt-draft-foot')], t, { y: 0, scale: 0.97 });
  s.tl.to(
    draft,
    {
      backgroundColor: 'rgba(22, 22, 22, 0)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0), inset 0 0 0 1px rgba(255, 255, 255, 0), 0 24px 60px rgba(0, 0, 0, 0)',
      duration: 0.5,
    },
    t,
  );

  // The query flies to where it lives in the dashboard, and the rule page builds around it.
  const from = box(s, query);
  const to = box(s, target);
  const w = box(s, win);
  s.tl.to(query, { x: to.x - from.x, y: to.y - from.y, duration: 1.3, ease: 'mn-in-out' }, t + 0.3);
  s.tl.set(scene, { autoAlpha: 1 }, t + 0.5);
  gsap.set(win, { autoAlpha: 0, scale: 0.97, transformOrigin: `${to.x - w.x + to.w / 2}px ${to.y - w.y + to.h / 2}px` });
  s.tl.to(win, { autoAlpha: 1, scale: 1, duration: 1 }, t + 0.8);
  gsap.set(target, { autoAlpha: 0 });
  s.tl.to(target, { autoAlpha: 1, duration: 0.3, ease: 'none' }, t + 1.5);
  s.tl.to(query, { autoAlpha: 0, duration: 0.3, ease: 'none' }, t + 1.6);
  s.tl.set(one(s, '.sc-pat'), { autoAlpha: 0 }, t + 1.9);

  buildRulePage(s, '.sc-rule', t + 1.1);
  // The evidence arrives: the weekly bars grow out of the baseline.
  const bars = all(s, '.sc-rule .rp-bar');
  gsap.set(bars, { scaleY: 0 });
  s.tl.to(bars, { scaleY: 1, duration: 0.6, stagger: 0.04 }, t + 1.9);
  enter(s, all(s, '.sc-rule .rp-sec h3, .sc-rule .rp-p, .sc-rule .rp-weekly-axis'), t + 1.3, { y: 8 });
  captionIn(s, 'rule', t + 1.2);

  s.t = t + 4.2;
  mark(s, 'rule', t, s.t);
}

/** Shared by both rule pages: the header, stat cards and rail arrive, numbers count up. */
export function buildRulePage(s: Story, scene: string, at: number) {
  enter(s, all(s, `${scene} .rp-top, ${scene} .rp-title, ${scene} .rp-scope`), at, { y: 8 });
  enter(s, all(s, `${scene} .rp-stat`), at + 0.15, { y: 10, stagger: 0.07 });
  all(s, `${scene} .rp-stat-n`).forEach((n, i) => count(s, n, at + 0.3 + i * 0.07, 0.9));
  all(s, `${scene} .meter span`).forEach((m) => {
    const full = Number(gsap.getProperty(m, 'scaleX'));
    gsap.set(m, { scaleX: 0 });
    s.tl.to(m, { scaleX: full, duration: 0.9, ease: 'mn-in-out' }, at + 0.4);
  });
  enter(s, all(s, `${scene} .rp-rail > *`), at + 0.5, { y: 10, stagger: 0.1 });

  // Starting state for the decision: still proposed, nothing recorded yet.
  gsap.set(one(s, `${scene} .win-tab .dot`), { attr: { 'data-s': 'proposed' } });
  gsap.set(one(s, `${scene} .rp-status-from`), { autoAlpha: 1 });
  gsap.set(one(s, `${scene} .rp-status-to`), { autoAlpha: 0 });
  gsap.set(one(s, `${scene} .rp-dec-pending`), { autoAlpha: 1 });
  gsap.set(one(s, `${scene} .rp-dec-done`), { autoAlpha: 0 });
  const fresh = one(s, `${scene} .rp-history-new`);
  gsap.set(fresh, { autoAlpha: 0 });
  gsap.set(one(s, `${scene} .rp-history-old`), { y: -fresh.offsetHeight });
  gsap.set(one(s, `${scene} .toast`), { autoAlpha: 0, y: 14 });
}

/** The decision lands: status flips, the rail records it, history grows, a toast confirms. */
export function recordDecision(s: Story, scene: string, at: number, status: string) {
  s.tl.set(one(s, `${scene} .win-tab .dot`), { attr: { 'data-s': status } }, at);
  swap(s, one(s, `${scene} .rp-status-from`), one(s, `${scene} .rp-status-to`), at, 0.4);
  swap(s, one(s, `${scene} .rp-dec-pending`), one(s, `${scene} .rp-dec-done`), at + 0.05, 0.4);
  s.tl.to(one(s, `${scene} .rp-history-old`), { y: 0, duration: 0.5, ease: 'mn-in-out' }, at + 0.1);
  s.tl.to(one(s, `${scene} .rp-history-new`), { autoAlpha: 1, duration: 0.4 }, at + 0.35);
  s.tl.to(one(s, `${scene} .toast`), { autoAlpha: 1, y: 0, duration: 0.5 }, at + 0.2);
}

/** A composer opening (materialises up) and closing (quicker, sinks away). */
export function openComposer(s: Story, el: HTMLElement, at: number) {
  gsap.set(el, { autoAlpha: 0, y: 10, filter: 'blur(4px)' });
  s.tl.to(el, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.45 }, at);
}

export function closeComposer(s: Story, el: HTMLElement, at: number) {
  s.tl.to(el, { autoAlpha: 0, y: 8, filter: 'blur(4px)', duration: 0.25 }, at);
}

/** Type a reason into a composer's box: placeholder goes, caret shows, the check turns green. */
export function writeReason(s: Story, composer: string, text: string, at: number, duration: number) {
  const placeholder = one(s, `${composer} .cmp-placeholder`);
  const caret = one(s, `${composer} .cmp-caret`);
  const ok = one(s, `${composer} .cmp-ok`);
  gsap.set(placeholder, { autoAlpha: 1 });
  gsap.set(caret, { autoAlpha: 0 });
  gsap.set(ok, { autoAlpha: 0 });
  s.tl.to(placeholder, { autoAlpha: 0, duration: 0.1 }, at);
  s.tl.set(caret, { autoAlpha: 1 }, at);
  type(s, one(s, `${composer} .cmp-typed`), text, at, duration);
  s.tl.to(ok, { autoAlpha: 1, duration: 0.3 }, at + duration - 0.1);
  s.tl.set(caret, { autoAlpha: 0 }, at + duration + 0.3);
}

export function decision(s: Story) {
  const t = s.t;
  const scene = one(s, '.sc-rule');
  const composer = one(s, '.sc-rule .rp-cmp');
  const approve = one(s, '.sc-rule .rp-approve');
  const submit = one(s, '.sc-rule .cmp-submit');
  const input = box(s, '.sc-rule .cmp-input');
  const hand = pointer(s, '.sc-rule');

  captionOut(s, 'rule', t);
  captionIn(s, 'decision', t + 0.5);

  // Approve.
  hand.show(t + 0.2, { x: 1330, y: 800 });
  hand.move(t + 0.3, box(s, approve), 0.9);
  hand.click(t + 1.25, box(s, approve), approve);
  openComposer(s, composer, t + 1.35);

  // The camera leans in while the engine replays 90 days and the reason gets written.
  s.tl.to(scene, { ...focus(box(s, composer), 1.08, 940, 500), duration: 1, ease: 'mn-in-out' }, t + 1.5);
  swap(s, one(s, '.sc-rule .cmp-bt-wait'), one(s, '.sc-rule .cmp-bt-done'), t + 3.3);
  all(s, '.sc-rule .cmp-bt-done .cmp-n').forEach((n) => count(s, n, t + 3.45, 0.7));
  hand.move(t + 1.6, { x: input.x + 60, y: input.y + 34 }, 0.6);
  hand.click(t + 2.25, input);
  hand.hide(t + 2.45);
  writeReason(s, '.sc-rule .rp-cmp', RULE_0412.reason, t + 2.4, 2);
  s.tl.to(scene, { x: 0, y: 0, scale: 1, duration: 0.9, ease: 'mn-in-out' }, t + 4.5);

  // Sign it.
  hand.show(t + 4.6, { x: input.x + input.w - 120, y: input.y + input.h + 14 });
  hand.move(t + 4.7, box(s, submit), 0.7);
  hand.click(t + 5.45, box(s, submit), submit);
  closeComposer(s, composer, t + 5.6);
  recordDecision(s, '.sc-rule', t + 5.7, 'active');
  hand.hide(t + 6.1);

  s.t = t + 7.4;
  mark(s, 'decision', t, s.t);
}
