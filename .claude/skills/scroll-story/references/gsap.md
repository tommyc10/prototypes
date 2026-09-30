# GSAP for scroll stories

What you need from GSAP to build one of these, and the traps that cost the most time. GSAP and
**every plugin are free**, including for commercial use: install the public `gsap` package plus
`@gsap/react`. No Club/auth token, no private registry.

## Contents
1. Setup · 2. Timelines · 3. ScrollTrigger · 4. React (useGSAP) · 5. Plugins · 6. Traps

## 1. Setup

Register once, in one module everything imports from (`src/lib/gsap.ts`):
```ts
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CustomEase } from 'gsap/CustomEase';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { TextPlugin } from 'gsap/TextPlugin';
gsap.registerPlugin(useGSAP, CustomEase, DrawSVGPlugin, ScrambleTextPlugin, ScrollToPlugin, ScrollTrigger, SplitText, TextPlugin);
CustomEase.create('story-out', '0.23, 1, 0.32, 1');       // strong ease-out: arrive / leave
CustomEase.create('story-in-out', '0.77, 0, 0.175, 1');   // strong ease-in-out: travel
export { gsap, useGSAP, ScrollTrigger, SplitText };
```

## 2. Timelines

- Create the master **paused** with defaults: `gsap.timeline({ paused: true, defaults: { ease: 'story-out', duration: 0.6 } })`.
- Place every tween with a **numeric position**: `tl.to(el, vars, t + 1.2)`. Numbers beat
  relative strings (`'<'`, `'+=0.3'`) here, because chapters are timed against each other and
  you'll retime beats.
- `tl.set(el, vars, at)`: zero-duration; reverts correctly when scrubbing back. Use it for
  scene visibility, attribute flips (`{ attr: { 'data-s': 'active' } }`), discrete counter steps
  (`{ textContent: 3 }`).
- `tl.addLabel(id, at)`; `tl.labels[id]` gives the time. `tl.time()` is the playhead.
- `keyframes` for there-and-back on one property: `{ keyframes: [{ scale: .86, duration: .08 }, { scale: 1, duration: .16 }] }`.
- Function-based values run when the tween first renders: `x: (i) => targets[i] - boxes[i].x`.
- Stagger objects: `{ amount: 0.5, from: 'end' }`, `{ each: 0.011 }`, `{ amount: 0.3, from: 'random' }`
  (the random order is fixed at creation, so scrubbing is deterministic).
- `autoAlpha` = opacity + `visibility: hidden` at 0. Use it for anything that appears or goes.
- Tweening a CSS variable: `tl.to(el, { '--halo': 1 })` (set it with `gsap.set` first).
- Pad the end so the last hold scrolls: `tl.set({}, {}, endTime)`.

## 3. ScrollTrigger

```ts
ScrollTrigger.create({ trigger: pinEl, start: 'top top', end: () => `+=${px}`, pin: true, scrub: 1,
  animation: tl, anticipatePin: 1, invalidateOnRefresh: true });
```
- **One** ScrollTrigger drives the master timeline. Never put `scrollTrigger` on a tween inside
  a timeline.
- `scrub: 1` means the playhead eases toward the scroll position over ~1 s. Use the
  **timeline's** `onUpdate` for anything that should follow what's on screen (rail, guide);
  ScrollTrigger's `onUpdate` runs ahead of the picture.
- `end` as a function, plus `invalidateOnRefresh`, re-measures on resize. Refresh happens on
  resize automatically; call `ScrollTrigger.refresh()` only after layout changes you cause.
- Seek from code: `st.start + (st.end - st.start) * (time / tl.duration())`, then
  `gsap.to(window, { scrollTo: y, duration, ease })`.
- `markers: true` while debugging; never ship it.

## 4. React (useGSAP)

```ts
useGSAP(() => {
  if (!fontsReady) return;
  const s = buildStory(stage);   // every gsap.set / tween / ScrollTrigger / SplitText in here is recorded
  /* … */
}, { scope: root, dependencies: [fontsReady] });
```
- Everything created inside is reverted on unmount and on dependency change. StrictMode's
  mount → unmount → mount works because of this.
- Selector strings are scoped to `scope`. Pass elements to `SplitText.create` rather than
  selectors, to be safe.
- Callbacks created later (click handlers that animate) should be wrapped with `contextSafe`.
- Don't let React re-render the scenes on every frame: keep per-frame state in refs and DOM
  writes; `memo` the scene tree; `setState` only when something discrete changes (active chapter).

## 5. Plugins

**SplitText** (caption and headline reveals):
```ts
const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'cap-line' });
gsap.set(split.lines, { yPercent: 105 });
tl.to(split.lines, { yPercent: 0, duration: 0.8, stagger: 0.08 }, at);
```
Split after fonts load. Give masked lines `padding-bottom:.08em; margin-bottom:-.08em` so
descenders aren't clipped.

**TextPlugin** (typing): `gsap.set(el, { text: '' }); tl.to(el, { text: { value: str }, duration, ease: 'none' }, at)`.

**ScrambleText** (specific → general): `tl.to(el, { scrambleText: { text: 'tb-coupling-*', chars: '*0123456789', speed: 0.6 }, duration: 0.6, ease: 'none' }, at)`.
Set the starting text first with `gsap.set(el, { text: 'tb-coupling-07' })`. It rewinds.

**DrawSVG** (lines drawing): `gsap.set(path, { drawSVG: '0%' }); tl.to(path, { drawSVG: '100%', ease: 'none' }, at)`.
The path needs a stroke.

**Counting**: GSAP tweens `textContent` directly: `tl.to(el, { textContent: 214, snap: { textContent: 1 } })`.
Integers only (decimals print float noise).

**ScrollToPlugin**: `gsap.to(window, { scrollTo: y, duration: 1.4, ease: 'story-in-out' })`.

## 6. Traps (all hit while building Midnight)

| Trap | What happens | Do this |
| --- | --- | --- |
| `from()`/`fromTo()` render immediately | A tween meant for the ending applies its start state at build time; the opening looks wrong | `gsap.set` the start + `tl.to`, or `immediateRender: false` |
| Measuring before fonts | Fly-tos miss by a few px | Build inside `document.fonts.ready` |
| Showing the stage before build | Every end-state scene flashes at once on reload | `data-ready` gate on `.stage` |
| A helper scheduled at time 0 | `swap(a, b, 0)` *plays* at 0; it doesn't just set the start | Use `gsap.set` for start states |
| Fading a parent | Its children (the thing you're flying) fade too | Fade the parent's background/shadow instead |
| Box-shadow tweens with different shadow counts | Jumps instead of tweening | Same number of shadows in from and to |
| Two tweens, same property, overlapping | They fight; scrubbing back jitters | Sequence them, or split properties (x vs scale) |
| CSS animation on `opacity` + GSAP `opacity` | CSS animations beat inline styles | Blink with CSS, show/hide with `autoAlpha` (visibility) |
| Mutating React DOM (wrapping text in spans) | Breaks under re-render | Put the spans in JSX |
| Timeline ends at the last tween | The final hold never scrolls into view | `tl.set({}, {}, endTime)` |
| Browser restores scroll on reload | Film opens mid-way, intro skipped | `history.scrollRestoration = 'manual'; scrollTo(0, 0)` |
