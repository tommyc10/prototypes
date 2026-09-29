# Midnight: the story

A scroll-driven film of the Midnight rule-management flow. It follows one alert from the
moment it fires to the rule that retires it, and the person who signs for it.

```bash
npm install
npm run dev      # http://localhost:5189
```

The "Open the dashboard" links point at the real app (the repo root, port 5188).
Change `DASHBOARD_URL` in `src/story/data.ts` if it lives somewhere else.

## The chapters

| # | Chapter | What the scroll does |
|---|---|---|
| – | Hero | A wall of live alerts. One fires, and the camera dives into it |
| 1 | The ticket | INC-40231 opens, its temperature crosses 70 °C, then it clears itself after 74 s |
| 2 | Recurrence | The ticket collapses into one square; the 213 before it rain in, week by week |
| 3 | Pattern | Values lift off the ticket, fly into a query, and scramble into general conditions |
| 4 | The rule | The query flies into the rule page, which builds around it |
| 5 | Decision | A pointer approves: backtest, written reason, Proposed → Active, toast |
| 6 | Suppression | The page folds into a gate. Matches drop into the pile; the rest page a person |
| 7 | Guardrails | RUL-0419: 41% confidence, a real attack run. The override hold is abandoned; rejected |
| 8 | Audit | The log fills in the order it happened |
| – | Outro | The same wall, quiet now |

## How it works

```
src/
├── App.tsx                 Film where there's room and motion is welcome, storyboard otherwise
├── lib/
│   ├── gsap.ts             GSAP + plugins, registered once; the dashboard's easing curves
│   ├── geometry.ts         Stage coordinates, camera (focus) and fly-to (morph) maths
│   └── path.ts             Smooth SVG paths for the temperature chart
└── story/
    ├── data.ts             Every word and number in the story
    ├── Film.tsx            The pinned stage, ScrollTrigger, progress rail, first-load intro
    ├── Storyboard.tsx      Static fallback: captions over stills of each scene
    ├── scenes/             One component per scene, drawn in its END state
    └── timeline/           The choreography, one master timeline
        ├── kit.ts          Helpers: captions, enter/leave, swap, count, type, pointer
        ├── opening.ts      Hero, ticket, recurrence
        ├── middle.ts       Pattern, rule, decision
        └── closing.ts      Suppression, guardrail, audit, outro
```

- **One fixed stage.** Everything is laid out on a 1440 × 900 canvas that is scaled to fit the
  window, so element positions never change with window size. Camera moves and fly-tos are
  measured from the DOM once and stay correct.
- **End state in the markup, start state in the timeline.** Scenes render finished (decided,
  counted, typed). Each chapter `gsap.set`s its starting state, then only tweens forward. That
  gives the storyboard its stills for free, and it means scrolling backwards is exact.
- **One timeline, scrubbed.** `ScrollTrigger` pins the stage and scrubs the whole film
  (`scrub: 1`). One timeline second ≈ a quarter of a screen of scroll (`SCROLL_PER_SECOND`).
- **Reduced motion or a small screen** gets the storyboard: same captions, still frames, no
  scroll-linked motion.

In dev, `window.__film` exposes the timeline, trigger and chapter marks, handy for seeking:
`__film.tl.duration()`, `__film.marks`.
