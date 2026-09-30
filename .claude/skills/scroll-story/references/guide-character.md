# A guide character

A small mascot who travels through the story with the viewer: sleeps through the opening
until the first beat wakes them, hops to a perch beside whatever matters in each chapter,
reacts in short speech bubbles, gets busy while the product works, flips when something good
lands, and falls asleep again at the end. In Midnight it's **Pip**, a green dragon with pink
headphones. It's the part people mention first.

Offer it; don't force it. It suits playful or developer-facing products; a bank's compliance
story might want it toned down to just the perch-and-point, without jokes.

## Contents
1. Where the character comes from · 2. What it does · 3. Writing its lines · 4. Perches ·
5. Code: data, choreography, component, wiring · 6. Storyboard fallback · 7. Checks

## 1. Where the character comes from

Midnight uses **bot-avatars** (libraries.dev/bots, by Jakub Antalik, MIT): animated glossy 3D
avatars drawn on a 2D canvas, with `default` / `working` / `sleeping` states that cross-fade,
eyes that follow the cursor, and a hop-and-flip on click.

- The npm package `bot-avatars` has the library's standard shapes (`clover`, `star`, `ghost`,
  `mech`…).
- The bundled fork adds `dragon` and `trooper` types. Its complete source lives at
  `assets/midnight/src/vendor/bot-avatars/`, relative to this skill. To use Pip, copy that
  folder with its `LICENSE` into the target project; no other workspace is needed.
- Any character works if it can: sit in a small box, show an idle/busy/asleep mood, and do a
  one-off celebratory move. A Lottie file or a simple SVG with CSS states would do.

Props that matter: `size` (72 in the film, 40 in the storyboard), `state`, `jumpEvery={0}`
(no random idle flips: flips should mean something), `seed`, and `interactive` (cursor-follow
and click-to-hop, which is on by default and delightful). Size it with `size`, never CSS
width/height (the canvas overscans its box to leave room to hop).

## 2. What it does

| Channel | How | Why |
| --- | --- | --- |
| Where it sits | x/y tweens on the **master timeline** (hops) | Part of the film: scrubs and rewinds |
| What it says, its mood, which way the bubble points | Looked up from `tl.time()` on every update | Scroll back and it un-says the line exactly |
| Celebratory flips | Fired when the playhead crosses a flip time **going forwards** | A celebration shouldn't replay when rewinding |
| Idle life | The avatar's own loop (blinks, looks at the cursor, hops when clicked) | Alive even when nobody's scrolling |

Moods for Midnight: `sleeping` at the start and end; `working` while the engine mines
patterns, during the 90-day backtest, and while the stream runs; `default` otherwise. Flips when
a rule is approved and when the dangerous rule is rejected.

## 3. Writing its lines

- **Captions explain; the guide reacts.** Never repeat the caption. Add a feeling, an aside, a
  pointer: "Watch the temperature…", "…and it fixed itself. At 6am.", "88 °C? That one pages a
  person.", "Don't… hold… that…", "Phew.", "Good call, Admiral."
- Short: under ~8 words; one line in the bubble (max ~340px wide).
- 2–3 lines per chapter, timed to *after* the thing they react to, off before the next hop.
- Asleep: "Zzz…" as the opening's first and the ending's last bubble.
- Mark one line per chapter `board: true` for the storyboard.

## 4. Perches

A perch is `{ x, y, side }`: the character's centre in stage pixels, and which side the bubble
goes (`right`, `left`, `above`). Rules that worked:

- **Sit on things**: the top edge of the main card (bottom of the 72px box ≈ the card's top
  edge), the top of the protagonist's cell in a chart, the gate's chip. Leave ~4px for the
  avatar's built-in rise, or it floats.
- When the product fills the canvas, wait **beside the caption**, below its text (~x 132, y 690).
- Put the bubble where there's empty space; check against the top bar (y < 68) and tall chart
  columns. Use `above` when both sides are busy.
- Follow the protagonist: in Midnight, Pip hops onto the ticket's square as the ticket shrinks into it.

## 5. Code

**Data** (`story/data.ts`):
```ts
export const GUIDE = { name: 'Pip', type: 'dragon' as const };
export type Scene = 'hero' | Chapter['id'] | 'outro';
export interface Line { scene: Scene; from: number; to: number; text: string; board?: boolean }
export const LINES: Line[] = [
  { scene: 'hero', from: 0, to: 0.7, text: 'Zzz…' },
  { scene: 'hero', from: 0.95, to: 1.6, text: 'Huh? Coupling 7. Again.' },
  { scene: 'ticket', from: 1.0, to: 3.2, text: 'Watch the temperature…' },
  // from/to are seconds after that scene's label
];
```
Chapters must add labels for every scene the guide refers to: `mark()` does it for chapters;
add `s.tl.addLabel('hero', 0)` and `s.tl.addLabel('outro', t)` yourself.

**Choreography** (`timeline/guide.ts`), run after all chapters:
```ts
export type Side = 'right' | 'left' | 'above';
const HALF = 36;                                    // the 72px box
const PERCH = {
  hero: { x: 720, y: 700, side: 'right' },          // asleep under the headline
  ticket: { x: 715, y: 146, side: 'right' },        // on the card's top edge
  week: { x: 1334, y: 336, side: 'above' },         // on the protagonist's square
  caption: { x: 132, y: 690, side: 'right' },       // when the product fills the canvas
  // …
} satisfies Record<string, { x: number; y: number; side: Side }>;

export interface GuideScript {
  lines: { id: number; from: number; to: number; text: string }[];
  moods: { at: number; mood: BotAvatarState }[];
  sides: { at: number; side: Side }[];
  flips: number[];
}

export function guide(s: Story): GuideScript {
  const el = one(s, '.guide');
  const start = (scene: Scene) => s.tl.labels[scene];
  const script: GuideScript = { lines: [], moods: [], sides: [], flips: [] };
  const mood = (scene: Scene, dt: number, m: BotAvatarState) => script.moods.push({ at: start(scene) + dt, mood: m });
  const flip = (scene: Scene, dt: number) => script.flips.push(start(scene) + dt);
  let here = PERCH.hero;
  gsap.set(el, { x: here.x - HALF, y: here.y - HALF });
  script.sides.push({ at: 0, side: here.side });

  // A hop: across on a travelling curve, up quickly, down under gravity.
  const hop = (scene: Scene, dt: number, to: typeof here, duration = 1.1) => {
    const at = start(scene) + dt;
    const peak = Math.min(here.y, to.y) - HALF - 70;
    s.tl.to(el, { x: to.x - HALF, duration, ease: 'story-in-out' }, at);
    s.tl.to(el, { y: peak, duration: duration * 0.45, ease: 'power2.out' }, at);
    s.tl.to(el, { y: to.y - HALF, duration: duration * 0.55, ease: 'power2.in' }, at + duration * 0.45);
    script.sides.push({ at, side: to.side });
    here = to;
  };

  mood('hero', 0, 'sleeping');
  mood('hero', 0.85, 'default');          // the alert wakes it…
  flip('hero', 0.9);                      // …with a start
  hop('hero', 1.5, PERCH.ticket, 1.6);    // rides the camera dive
  s.tl.to(el, { keyframes: [{ scale: 1.35, duration: 0.8 }, { scale: 1, duration: 0.8 }], ease: 'story-in-out' }, start('hero') + 1.5);
  hop('recurrence', 0.2, PERCH.week);
  // … moods and flips per chapter …
  mood('outro', 2.2, 'sleeping');

  script.lines = LINES.map((l, id) => ({ id, from: start(l.scene) + l.from, to: start(l.scene) + l.to, text: l.text }));
  return script;
}

export function guideAt(script: GuideScript, time: number) {
  const latest = <T extends { at: number }>(list: T[]) => list.filter((x) => x.at <= time).pop() ?? list[0];
  return {
    mood: latest(script.moods).mood,
    side: latest(script.sides).side,
    line: script.lines.find((l) => time >= l.from && time < l.to) ?? null,
  };
}
```
`buildStory` returns `{ ...s, guide: guide(s) }`.

**Component** (`story/Guide.tsx`): the bubble remounts per line (`key`), so each enters fresh
via CSS `@starting-style` and the previous one leaves instantly.
```tsx
export const Guide = forwardRef<HTMLCanvasElement, GuideView>(function Guide({ mood, side, line }, ref) {
  return (
    <div className="guide" data-side={side} aria-hidden>
      <BotAvatar ref={ref} type={GUIDE.type} size={72} state={mood} jumpEvery={0} seed={0.3} />
      {line && <p className="guide-bubble" key={line.id}>{line.text}</p>}
    </div>
  );
});
```
```css
.guide { position: absolute; top: 0; left: 0; width: 72px; height: 72px; z-index: 5; }
.guide-bubble {
  position: absolute; width: max-content; max-width: 340px; margin: 0; padding: 9px 13px;
  border-radius: 12px; background: rgba(28,28,28,.92); backdrop-filter: blur(12px);
  box-shadow: inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2), 0 12px 32px rgba(0,0,0,.5);
  font-size: 14px; font-weight: 500; line-height: 1.4; pointer-events: none;
  transition: opacity 220ms var(--ease-out), scale 220ms var(--ease-out), filter 220ms var(--ease-out);
  @starting-style { opacity: 0; scale: .94; filter: blur(4px); }
}
.guide[data-side='right'] .guide-bubble { top: 50%; left: calc(100% + 16px); translate: 0 -50%; transform-origin: left center; }
.guide[data-side='left']  .guide-bubble { top: 50%; right: calc(100% + 16px); translate: 0 -50%; transform-origin: right center; }
.guide[data-side='above'] .guide-bubble { right: 10px; bottom: calc(100% + 20px); transform-origin: right bottom; }
/* + a small rotated-square tail per side via ::before */
```

**Wiring** (`Film.tsx`): render `<Guide ref={pip} {...guide} />` after `<Captions/>` inside the
stage, hold `GuideView` in state, and update it from the timeline:
```ts
let said = '', last = 0;
tl.eventCallback('onUpdate', () => {
  const time = tl.time();
  const g = guideAt(s.guide, time);
  const key = `${g.mood}|${g.side}|${g.line?.id ?? ''}`;
  if (key !== said) setGuide(((said = key), g));                         // setState only on change
  if (s.guide.flips.some((f) => last < f && time >= f))                    // forwards only
    pip.current?.dispatchEvent(new MouseEvent('click', { bubbles: true })); // the avatar's own hop
  last = time;
});
```
Add the guide to the first-load intro (`.from('.guide canvas', { autoAlpha: 0, y: 16 })`), and
`memo` the scenes so guide updates don't re-render them.

## 6. Storyboard fallback

Under each chapter's caption, the chapter's `board` line beside a still 40px avatar
(`interactive={false}`); a sleeping one above the closing title.

## 7. Checks

- Screenshot every perch: is it sitting *on* things, not floating? Does the bubble collide?
- Count flips: attach a click listener to `.guide canvas`, scroll forwards through all flip
  times (expect N), scroll back (still N).
- Reduced motion: bot-avatars draws a still pose on its own. Leave that behaviour alone.
