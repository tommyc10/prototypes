# Motion, performance, accessibility and polish

## Curves

| Movement | Ease | Examples |
| --- | --- | --- |
| Arriving or leaving | `story-out` (0.23, 1, 0.32, 1) | Cards, captions, toasts, a scene entering |
| Travelling on screen | `story-in-out` (0.77, 0, 0.175, 1) | Camera moves, fly-tos, morphs, the pointer |
| Machines and clocks | `none` | Timers, typing, conveyor belts, hold-to-confirm fill, draw-on lines |
| A character's hop | up `power2.out`, down `power2.in` | A mascot jumping between perches (gravity) |

Never ease-in on UI entering. It hesitates at the moment people are watching. If the product
has its own easing tokens, use those so the story moves like the product.

## Durations (timeline seconds)

| Beat | Duration |
| --- | --- |
| Camera dive | 1.4–1.8 |
| Fly-to / morph / FLIP | 1.2–1.3 |
| Scene or card entering | 0.8–1.0 |
| Caption in / out | 0.8 in, 0.45 out |
| Form open / close | 0.45 / 0.25 (closing is faster) |
| Badge swap | 0.35–0.4 |
| Counter | 0.7–1.0 (or match what it counts) |
| Typing | ~0.05 s per character, 1.8–2.2 for a sentence |
| Hold at the end of a chapter | ~1.0 |

Scrubbed timelines are "marketing speed", so they can run longer than UI rules (>300ms) allow.
The scroll sets the real pace.

## Properties and performance

- Animate `transform` and `opacity` (and `clip-path` for fills). Never animate
  `width/height/top/left` in a scrubbed film.
- **Blur** only to hide a crossfade seam, ≤ 8px, on elements that are fading out anyway.
- `will-change: transform` only on a layer the camera zooms *and leaves* (the wall). Layers that
  rest zoomed must not have it, or they rasterise soft.
- `backdrop-filter` only on small glass pieces (a form, a toast, a bubble), never on full-stage layers.
- Hide off-stage scenes with `autoAlpha: 0` so they don't paint.
- Hundreds of small elements (a unit chart) are fine; thousands, use a canvas.
- Idle "life" (breathing status dots, a spinner) is CSS keyframes on opacity/transform, wrapped
  in `@media (prefers-reduced-motion: no-preference)`.

## Accessibility

- **Reduced motion or small screens get the storyboard**, not a gentler film. Big scroll-linked
  camera moves are exactly what reduced motion asks to avoid.
- The film is real HTML: the hero is an `h1`, captions are `h2` + `p`. Decorative layers (the
  wall, a guide character's bubbles) are `aria-hidden`.
- Hidden scenes use `autoAlpha`, so their buttons can't be tabbed to until they're on screen.
- Rail segments are real `<button>`s with `aria-label`s; the chapter label is `aria-live="polite"`.
- Hover effects inside `@media (hover: hover) and (pointer: fine)`.

## The polish checklist

These separated "works" from "crazy good" in Midnight:

- [ ] The opening fades in on first load (the wall's columns rise at different offsets, the
      headline words un-blur one by one).
- [ ] The protagonist is highlighted *before* the camera dives into it, so the eye is already there.
- [ ] Every chapter boundary carries something; nothing just cross-fades.
- [ ] Counters count *with* what they count (the rain and the number end together).
- [ ] Mid-transition frames look intentional, not broken: screenshot them.
- [ ] The camera leans in for reading, and pulls back before the result lands.
- [ ] The decision moment updates everything at once: badge, tab dot, side panel, history, toast.
- [ ] One near-miss in the "at scale" chapter (same source, over the line → still pages a person).
- [ ] A guardrail chapter that shows what the product *won't* let you do.
- [ ] The ending returns to the opening, transformed; the protagonist goes quiet last.
- [ ] "Watch it again" rewinds the whole film on screen.
- [ ] The progress rail fills per chapter and jumps on click.
- [ ] No flash on reload; nothing overlapping at load.
- [ ] Copy is concrete (IDs, times, numbers) and there's exactly one joke.
