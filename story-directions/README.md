# Midnight · Fly

**Fly is the selected default.** Open http://localhost:5191 with no query string to see it.
Zoom and Snap remain available through the picker or `?d=zoom` / `?d=snap`.
The original **Midnight** version lives in [`../midnight-story/`](../midnight-story/).

The same five-chapter Midnight story (one alert → 214 like it → a rule → a person approves →
the gate), in Midnight's own look (dark UI, Geist, the dashboard's cards, badges and buttons),
told with three completely different **motion grammars**. The look stays; how you move
through it changes.

```bash
npm install
npm run dev      # http://localhost:5191   (?d=zoom | snap | fly, or press 1 / 2 / 3)
```

## The three

| | 1 · Zoom | 2 · Snap | 3 · Fly |
|---|---|---|---|
| How the scroll works | Smooth scrub | **Snaps**: each flick plays one move through to a resting frame | Smooth scrub |
| Camera | 2D **portal zooms** into the app, five times: board → group → alert → back out → rule → board | Barely moves: the **layout** does the travelling | A real **3D** camera: dolly, orbit, crane, tilt |
| Signature moment | Scrolling into one dot on the Tractor Beam Ops card and landing on that alert's page | Scrolling *through the hole in the "o"* of "noise" | Pulling back to see the alert was one tile in a wall of 214 |
| Carry-overs | Dot → page → dot → chart square · leader lines → rule · rule page → a card on the board | "o" → page · the page's 12 slats gather into the bar chart · next page slides over (parallax) · Approve opens an iris · bands wipe · the alert that got through opens the ending | Card → tile · chips fly out of the wall into the rule · approval comes forward in z · page → floor |
| Captions | Glass panel (the canvas under it keeps changing) | Midnight's left column | Midnight's left column |
| Extra chrome | Zoom readout `×120` | None | Depth and tilt readout |
| Best for | "From the whole system down to one record" | Launch pages, keynote-style pacing | Systems at scale, technical products |

All three share the scroll-story contract: pinned, one scrubbed timeline, scenes drawn in their
end state, exact rewind, the Midnight top bar and chapter rail (click to jump), the load gate,
and a text fallback for small screens and reduced motion.

`?nosnap` turns Snap's snapping off, for seeking to exact times while testing.

## Techniques (now in the scroll-story skill)

- **Portal zoom** (`src/lib/camera.ts`): the next screen is drawn as a miniature inside the
  current one; both layers ride one log-scale zoom and stay locked. `backdrop`, `beyond`,
  `prime` and `onZoom` cover zooming into regions, going through holes, and live readouts.
- **Snap to beats** (`shared/Film.tsx`): ScrollTrigger `snap` with `snapDirectional` over each
  chapter's resting time.
- **Slats**, **iris**, **slide with parallax**, **bands**: see `directions/snap/timeline.ts`.
- **3D orbit camera** (`directions/fly/timeline.ts`): target, distance, tilt, turn, with the
  CSS 3D rules in `FlyStage.tsx`'s header.

## Files

```
src/
├── lib/        gsap · geometry · kit (the skill's) · camera (portal zoom)
├── styles/     base · midnight (the dashboard's tokens + components) · hero
├── shared/     story (copy + numbers) · Film · MidnightBar · Frames (hero, outro) · Picker · Board
└── directions/
    ├── zoom/   map (the board) · Sheets (alert + rule pages) · ZoomStage · timeline · zoom.css
    ├── snap/   SnapStage · timeline · snap.css
    └── fly/    space (the world) · FlyStage · timeline · fly.css
```
