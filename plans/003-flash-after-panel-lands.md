# 003 — Hold the hand-off ring until its card has landed

- **Status**: DONE
- **Commit**: de3a3c2 (plus uncommitted working tree: `src/pages/outlook/` is not yet committed; the excerpts below are the code as of 23 Oct 2026)
- **Severity**: MEDIUM
- **Category**: Interruptibility / timing
- **Estimated scope**: 2 files, ~4 lines

## Problem

A pattern card's **In the forecast →** button switches to the Forecast view and rings the matching prediction card, so the eye can find where it landed. The **← PAT-xx** link does the same in reverse. The ring starts the moment the view switches, while the target panel is still arriving.

```css
/* src/pages/outlook/OutlookPage.css:187-206 — current */
.ol-pat[data-flash],
.ol-pred[data-flash] {
  animation: ol-flash 1600ms var(--ease-out);
}

@keyframes ol-flash {
  0%,
  35% {
    box-shadow:
      inset 0 0 0 1px var(--line),
      0 0 0 2px var(--focus-ring);
  }
  100% {
    box-shadow:
      inset 0 0 0 1px var(--line),
      0 0 0 2px transparent;
  }
}
```

```tsx
/* src/pages/outlook/OutlookPage.tsx:75-82 — current */
  // A flashed card is scrolled into its list, and the flash lets go once it has played.
  useEffect(() => {
    if (!flash) return;
    const card = listRef.current?.querySelector<HTMLElement>(`[data-pattern="${flash}"]`);
    if (card) card.parentElement!.scrollTop = card.offsetTop - card.parentElement!.offsetTop - 4;
    const t = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(t);
  }, [flash, view]);
```

Today the target panel arrives in stagger slot 8, landing at 540ms. The ring is only at full strength until 35% of 1600ms, which is 560ms, so its peak is spent while the card is still fading in. After plan 001, a hand-off is a pointer change, so the target panel arrives with the 180ms swap (no stagger). The ring should begin when that swap ends.

## Target

- The ring starts **180ms** after the card mounts, matching the `ol-swap` duration from plan 001. Its full-strength hold runs from 180ms to 740ms, after the card has landed, then fades out by 1780ms.
- During the 180ms delay the card shows the ring's first frame (`animation-fill-mode: backwards`), so the ring arrives together with the card instead of popping in after it.
- The React timer that clears the flash waits for the whole animation: **1800ms** (180 + 1600, rounded up), so it never cuts the fade short.
- It stays colour-only (a `box-shadow` fade), so it stays under reduced motion, as the existing comment says.

## Repo conventions to follow

- Colour-only feedback that stays under reduced motion is documented in the comment above the rule (`OutlookPage.css:185-186`). Keep that comment and add one sentence about the delay.
- Easing: `var(--ease-out)` from `src/styles/base.css:4`.

## Steps

1. `src/pages/outlook/OutlookPage.css`: in the `.ol-pat[data-flash], .ol-pred[data-flash]` rule, replace `animation: ol-flash 1600ms var(--ease-out);` with:
   ```css
   /* Starts as its panel finishes arriving (the 180ms swap), so its strongest moment lands on a settled card. */
   animation: ol-flash 1600ms var(--ease-out) 180ms backwards;
   ```
2. `src/pages/outlook/OutlookPage.tsx`: in the flash `useEffect` (lines 75-82), change `setTimeout(() => setFlash(null), 1600)` to `setTimeout(() => setFlash(null), 1800)`.

## Boundaries

- Do NOT change the `@keyframes ol-flash` stops or colours.
- Do NOT change how the card is scrolled into view.
- Requires plan 001 to be done. If `ol-swap` does not exist in `src/pages/outlook/components/charts/charts.css`, STOP and report.
- If a step doesn't match the code you find (drift), STOP and report instead of improvising.

## Verification

- **Mechanical**: `./node_modules/.bin/tsc -b --pretty false` exits 0.
- **Feel check** (`#/outlook`):
  - On the Hindcast, click **In the forecast →** on any pattern card. The Forecast view swaps in, and the matching prediction card wears a bright ring once it has settled, then the ring fades out over about a second.
  - From a prediction, click **← PAT-xx**: the same on the matching pattern card.
  - In DevTools → Animations at 10% playback: `ol-swap` runs 0–180ms on the panels, `ol-flash` starts at 180ms on the card, and the ring is visible (not absent) during the first 180ms.
  - Click two hand-off links within a second: the second ring plays in full on its card; the first never cuts it short.
  - With `prefers-reduced-motion: reduce` emulated, the ring still plays. It's colour only.
- **Done when**: the ring's full-strength moment is visibly on a settled card, every time.
