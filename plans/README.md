# Animation plans

Plans written by `improve-animations` for the Hindcast & forecast page (`src/pages/outlook/`).
Each is self-contained: hand any one to an agent as is, with no other context.

All four were written against commit `de3a3c2` plus the uncommitted `src/pages/outlook/` working
tree as of 23 Oct 2026. Each plan quotes the code it expects and says to stop if the code has drifted.

Since then the page has been split in two: `src/pages/outlook/` is now `src/pages/hindcast/` (with the shared
pieces) and `src/pages/forecast/`. The plans' paths describe the code as it was when they were done.

Later still, 001's 180ms `swap` fade on a scope change was removed: it flashed. A scope change now
keeps every panel mounted and morphs the charts (`hooks/useTween.ts`), and the story plays once per load.

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Play the outlook's entrance once, and swap quickly after](001-one-shot-entrance.md) | HIGH | DONE |
| 002 | [Let the root-cause chip appear without animating](002-chip-without-animation.md) | HIGH | DONE |
| 003 | [Hold the hand-off ring until its card has landed](003-flash-after-panel-lands.md) | MEDIUM | DONE |
| 004 | [Firmer row press, and a crossfade between chart and table](004-press-scale-and-table-swap.md) | LOW | DONE |

## Order

1. **001** first. It defines the `'story'` / `'swap'` motion states that 003 and 004 rely on.
2. **002** any time. It's independent: one file, deletions only.
3. **003** after 001. Its 180ms delay matches 001's swap.
4. **004** after 001. Without 001, switching back to a chart replays its whole entrance draw.

002 can run in parallel with 001. 003 and 004 touch different files from each other, so they can run in parallel once 001 is done.
