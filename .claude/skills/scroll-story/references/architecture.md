# Architecture

How a scroll story is put together, and why each decision was made. The starter in
`assets/starter/` implements all of this; read this file to understand what you're editing.

## Contents
1. The film: pin + scrub
2. The stage: a fixed canvas
3. Scenes: drawn in their end state
4. The timeline: one master, chapters appended
5. Measuring positions
6. Loading: fonts, then build, then show
7. Progress rail and chapter jumps
8. The fallback storyboard
9. Dev hook

## 1. The film: pin + scrub

```
<div class="film">                ← root; data-ready once the timeline is built
  <div class="film-pin">          ← 100vh, pinned by ScrollTrigger
    <div class="stage">           ← 1440 × 900, scaled to fit
      <Scenes/> <Captions/> [<Guide/>]
    </div>
    <TopBar/>                     ← viewport-sized, outside the stage
  </div>
</div>
```

```ts
ScrollTrigger.create({
  trigger: film.querySelector('.film-pin'),
  start: 'top top',
  end: () => `+=${tl.duration() * innerHeight * SCROLL_PER_SECOND}`, // re-evaluated on refresh
  pin: true,
  scrub: 1,            // the playhead trails the scroll bar by ~1 s: smooth, cinematic
  animation: tl,
  anticipatePin: 1,
  invalidateOnRefresh: true,
});
```

Why `scrub: 1` and not `true`: wheel scrolling arrives in steps. A 1 s catch-up turns steps
into glide. Don't add a smooth-scroll library as well.

## 2. The stage: a fixed canvas

```css
.stage { position: absolute; top: 50%; left: 50%; width: 1440px; height: 900px;
         transform: translate(-50%, -50%) scale(var(--stage-scale, 1)); }
```
```ts
root.style.setProperty('--stage-scale', String(Math.min(innerWidth / 1440, innerHeight / 900)));
```

Everything inside is laid out in stage pixels. Letterboxing on odd aspect ratios is invisible
because the page background matches. Conventions:
- Captions: x 96–476, vertically centred (`.caps`).
- Canvas for scene content: x ~520–1400. The camera's "centre of attention" is about
  (960, 450), not (720, 450), because the captions own the left.
- The top bar overlays y 0–68 in viewport space; keep important scene content below ~80.

## 3. Scenes: drawn in their end state

Each scene is a component whose root is `<div className="scene sc-name">` (absolute, inset 0).
Inside, position things with absolute pixels in CSS.

**Draw the finished state.** The badge that flips from Proposed to Active is two badges stacked
in one grid cell (`.badge-swap`), with CSS hiding the "from" one. A counter holds its final
number. A typed reason is already typed. A pill that ends up in a pile is positioned in the pile.

The timeline then `gsap.set`s the starting state and tweens forward. Three payoffs:
1. **Exact rewind**: GSAP restores recorded start values when scrubbing backwards.
2. **Free stills**: the storyboard renders the same components without a timeline, and
   they're already finished.
3. **Clean teardown**: `useGSAP` reverts every set and tween on unmount.

Things that only exist mid-story (a cursor, a flying chip, a composer that opens and closes) are
hidden in CSS (`opacity: 0; visibility: hidden`), because that's their end state too.

## 4. The timeline: one master, chapters appended

```ts
export function buildStory(stage: HTMLElement) {
  const s = createStory(stage);                         // paused timeline, defaults { ease: 'story-out' }
  gsap.set(stage.querySelectorAll('.scene:not(.sc-wall):not(.sc-hero)'), { autoAlpha: 0 });
  CHAPTERS.forEach((c) => prepareCaption(s, c.id));     // split titles into masked lines, hide
  hero(s); ticket(s); pattern(s); outro(s);             // each appends at s.t and moves s.t on
  return s;
}
```

A chapter:
```ts
export function ticket(s: Story) {
  const t = s.t;                                        // this chapter's start
  s.tl.set(one(s, '.sc-ticket'), { autoAlpha: 1 }, t);  // show its scene
  gsap.set(card, { autoAlpha: 0, scale: 0.72 });        // START state (build time)
  s.tl.to(card, { autoAlpha: 1, scale: 1, duration: 1 }, t);  // tween FORWARD
  captionIn(s, 'ticket', t + 0.6);
  // …
  s.t = t + 4.6;                                        // where the next chapter starts
  mark(s, 'ticket', t, s.t);                            // rail + label
}
```

Organise chapters into a few files by act (`opening.ts`, `middle.ts`, `closing.ts`), with shared
helpers exported from where they're first needed. Hide a scene again (`tl.set(scene,
{ autoAlpha: 0 })`) once the next one covers it, so off-stage layers don't paint.

## 5. Measuring positions

```ts
export function boxIn(el: HTMLElement, root: HTMLElement): Box {   // walks offsetParent
  let x = 0, y = 0, node: HTMLElement | null = el;
  while (node && node !== root) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent as HTMLElement | null; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}
```

`offsetLeft/Top` ignore transforms, so a box is where the element sits *at rest*, regardless of
what GSAP is doing to it or the stage scale. Measure at build time; the fixed stage keeps it
valid. SVG elements have no offsets: measure their HTML wrapper instead.

Anything that must move *with* a camera (a cursor clicking inside a zoomed scene, a chip flying
within it) should live **inside that scene**. It then inherits the scene's transform, and you
can work in the scene's own coordinates.

## 6. Loading: fonts, then build, then show

```ts
useEffect(() => { document.fonts.ready.then(() => setFontsReady(true)); }, []);
useGSAP(() => {
  if (!fontsReady) return;
  const s = buildStory(stage);
  /* …ScrollTrigger… */
  film.dataset.ready = '';            // start states are set; safe to show the stage
}, { scope: root, dependencies: [fontsReady] });
```
```css
.film:not([data-ready]) .stage { visibility: hidden; }
```

Without the gate, every scene shows in its end state for a moment on load. The first-load intro
(a separate, non-scrubbed timeline that fades in the hero) only runs if `scrollY < 4`, and it
must animate *different elements* from the scrubbed timeline (children vs containers) so they
don't fight. `App.tsx` sets `history.scrollRestoration = 'manual'` and scrolls to 0, because
resuming a film mid-way is confusing.

## 7. Progress rail and chapter jumps

`mark(s, id, start, end)` records each chapter's span and adds a label. The rail fills from the
timeline's `onUpdate` (not ScrollTrigger's, because with scrub the timeline lags the scroll):

```ts
tl.eventCallback('onUpdate', () => {
  const time = tl.time();
  marks.forEach((m, i) => fills[i].style.transform = `scaleX(${clamp(0, 1, (time - m.start) / (m.end - m.start))})`);
  // setState only when the active chapter changes
});
```

To jump to a chapter: map a time to a scroll position and tween the window.
```ts
const y = st.start + (st.end - st.start) * (time / tl.duration());
gsap.to(window, { scrollTo: y, duration: 1.4, ease: 'story-in-out' });
```
Aim ~1.8 s past the chapter start, where it has settled. "Watch it again" scrolls to 0 over
~2.6 s: the whole film rewinds on screen, which people love.

## 8. The fallback storyboard

`App.tsx` renders `<Film/>` only for `(min-width: 900px) and (min-height: 560px) and
(prefers-reduced-motion: no-preference)`; otherwise `<Storyboard/>`: each caption, then a
`<Frame crop={{x, y, w, h}}>` showing part of the stage scaled to the column width. Scenes that
share a chapter group share a still. Nothing moves on scroll.

## 9. Dev hook

```ts
if (import.meta.env.DEV) Object.assign(window, { __film: { tl, st, marks } });
```
This is how the verification scripts seek to exact times. It's stripped from production builds.
