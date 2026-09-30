# Case study: Midnight, the story

The build this skill comes from. Read it to see a whole story put together, beat by beat.

- **Code**: the local `midnight-story/` source directory, when available.
  `npm install && npm run dev`, then open the URL printed by the dev server.
- **Team explainer**: `midnight-story/docs/how-it-works.html`, a plain-language walkthrough with
  live demos. A good model if the user wants to explain their story to a team.
- **Three more ways to move** through a shorter version of the same story, in the same look:
  `story-directions/` in the local project (the project dev-server URL, `?d=zoom | snap | fly`). See
  `references/directions.md`.
- **The product**: Midnight, a rule-governance dashboard for incident management (the repo
  root app, Star Wars-themed mock data: "Imperial Ops"). An engine proposes suppression rules
  from recurring incident patterns; a person approves each with a written reason; everything
  is audited.

## The story

Protagonist: **INC-40231**, "Tractor beam coupling 7 temperature warning", 06:00, auto-clears
after 74 s. Tagline: *Silence the noise. Never the signal.* Guide: **Pip** the dragon.

| Time (s) | Chapter | On screen / what the scroll does | Carries into next | Pip |
| --- | --- | --- | --- | --- |
| 0–2.3 | Opening | 76-row wall of live alerts; headline clears, one row fires (amber halo) | Camera dives ×9 into that row | Asleep → startled flip |
| 2.3–7.0 | 1 The ticket | Card grows to meet you; temperature line draws past 70 °C (DrawSVG, amber clip) while a timer counts to 74 s; Open → Auto-cleared | Card shrinks into one square | On the card: "…fixed itself. At 6am." |
| 7.0–12.3 | 2 Recurrence | The square is this week's; 213 more rain in by week; count runs 1 → 214; three facts | All squares pour into a stack | On the square |
| 12.3–19.1 | 3 Pattern | Values lift off the ticket as chips, arc into a query, scramble specific → general; engine status flips to "Proposed" | The query flies into the rule page | Busy |
| 19.1–23.3 | 4 The rule | Rule page builds around the landed query; stats count; weekly bars grow | Same scene | Beside the caption |
| 23.3–30.7 | 5 Decision | Pointer clicks Approve; form opens; camera leans in; backtest replays; reason types itself; submit; badge, tab dot, rail, history and toast all update | Page folds into the gate's chip | Busy, then flips: "Signed and logged." |
| 30.7–41.5 | 6 Suppression | Gate with lane, tray and on-call queue; 10 alerts ride through: 7 suppressed (struck, piled), 3 paged, incl. same coupling at 88 °C with a callout | A new-proposal notification; camera dives into it | Gatekeeper, busy |
| 41.5–55.9 | 7 Guardrails | RUL-0419: 41% confidence, a real attack run in its evidence (row flares); approve → hold-to-override starts… released; cancel; reject with a reason | Page steps back | "Don't… hold… that…", "Phew.", flips at "Good call, Admiral." |
| 55.9–60.3 | 8 Audit | Log card; entries reveal oldest-first as the rail draws | Wall returns | On the log |
| 60.3–63.7 | Ending | The same wall from slightly closer, settling; noise rows go quiet; INC-40231 last; "Quiet, on purpose." + stats + CTAs | – | Hops above the title, falls asleep |

Total ≈ 63.7 s of timeline at 0.24 screens per second ≈ 15 screens of scroll.

## File map

```
midnight-story/src/
├── App.tsx                  film vs storyboard
├── lib/{gsap,geometry,path}.ts
├── vendor/bot-avatars/      the dragon (MIT)
└── story/
    ├── data.ts              all copy, the wall, the stream, the audit log, Pip's lines
    ├── Film.tsx · Storyboard.tsx · Captions.tsx · TopBar.tsx · Guide.tsx · Scenes.tsx
    ├── scenes/              Wall, Hero, Ticket, Recurrence, Pattern, RuleCode, RulePage
    │                        (RuleScene + GuardScene share it), Cursor, Gate, Audit, Outro
    └── timeline/            kit, opening (hero/ticket/recurrence), middle (pattern/rule/decision,
                             plus shared rule-page helpers), closing (suppression/guardrail/audit/outro),
                             guide (Pip), index
```

## What went wrong, and the fixes (now in this skill)

- **Chip showed doubled text** mid-flight: it was translucent over the source field. Made it opaque.
- **88 °C callout never appeared**: the data attribute it keyed on was on the queue row, not the
  pill. Test the scripted beats, not just the scenes.
- **Toast overlapped a chart**: moved to a window-level overlay in the rail's empty corner.
- **The rejected tab's dot vanished**: a `box-shadow: none` override killed the hollow-ring style.
- **Reload flash**: every end-state scene showed for a moment before the timeline set start
  states. Fixed with the `data-ready` gate on the stage.
- **A helper scheduled at t = 0** (`swap(…, 0)`) *played* the swap at the start instead of
  just setting the initial state.
- **Mutating React DOM** to wrap digits for counting. Moved the spans into JSX.
- **Pip floating above his perch**: the avatar draws slightly below its box's centre; perches
  sit ~8px lower than the geometric edge.
