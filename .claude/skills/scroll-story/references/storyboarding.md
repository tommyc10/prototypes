# Storyboarding a scroll story

The storyboard decides whether the page is memorable. Get it right before writing code.

## 1. Pick the protagonist

Choose **one concrete object** the viewer can follow from start to finish. Not "alerts", but
*INC-40231, tractor beam coupling 7, 06:00*. Not "orders", but *order #1182, two lamps, shipping
to Leeds*. Give it an ID, a time, a specific detail or two. A named, specific thing makes every
later abstraction ("214 like it", "a rule that matches it") land as a consequence.

Good protagonists already exist in the product's mock data. Use them.

## 2. Find the arc

Most B2B workflow products fit this arc (Midnight's, with the chapter it became):

| Beat | Midnight | Generic form |
| --- | --- | --- |
| The noise | A wall of live alerts | The status quo, overwhelming |
| The one | One alert, auto-clears in 74 s | Zoom in on one instance of the problem |
| It's not one | 214 like it, every shift change | Reveal it's a pattern (a count, a chart) |
| The insight | The engine extracts conditions | The product notices / does the clever bit |
| The artefact | A proposed rule with evidence | The product's core object, in its real UI |
| The human | A person approves, with a reason | Control, trust, the decision moment |
| The effect | Alerts stream through a gate | The product working at scale |
| The edge case | A 41% rule with a real attack in it | A guardrail: what it *won't* let you do |
| The record | The audit log | Accountability, history, proof |
| The quiet | The same wall, now quiet | Bookend: the opening, transformed |

You don't need every beat. A consumer app might be *the moment → the magic → the result*.
But **open and close on the same image**, changed. That bookend is what makes it feel finished.

## 3. Plan the carry-overs

For every chapter boundary, decide what physically travels. This is the single most important
column in the storyboard, because it's what makes it a film rather than a slideshow.

| From → to | Carry-over used in Midnight |
| --- | --- |
| Opening → ticket | The camera dives ×9 into one row of the wall; the ticket grows up behind it |
| Ticket → recurrence | The ticket card shrinks into one square of a weekly unit chart |
| Recurrence → pattern | All 214 squares pour into a stack of cards |
| Pattern → rule | The query flies into its place on the rule page, which builds around it |
| Rule → decision | Same scene; the camera leans in on the approval form |
| Decision → gate | The whole rule page folds down into a small "rule" chip on a gate |
| Gate → guardrail | A new proposal notification arrives; the camera dives into it |
| Guardrail → audit | The page steps back; the log fills oldest-first |
| Audit → ending | The wall returns, quiet |

## 4. Write the storyboard table

Show the user this table before building:

```
| # | Chapter | Caption title | On screen | What the scroll does | Carries into next |
|---|---------|---------------|-----------|----------------------|-------------------|
| – | Opening | (headline)    | …         | …                    | camera dives into … |
| 1 | …       | …             | …         | …                    | … |
```

## 5. Captions

Each chapter has a caption on the left: a small meta line ("02 — Recurrence"), a title, a body,
and optionally an aside. Rules of thumb from Midnight:

- **Title: under ~8 words, a complete thought.** "It starts with a ticket." "A person signs
  for it." "Not everything that repeats is noise."
- **Body: 2–3 sentences, concrete.** Numbers, times, names. "214 times in 90 days, always at
  shift change, and 98% gone before anyone looked."
- **Captions explain; the scene shows.** Don't caption what's visible. Say why it matters.
- **One joke, late.** Midnight's aside, under the guardrail chapter: "Someone should have told
  the Death Star." It lands because everything before it was straight.

## 6. Pacing

- 1 timeline second ≈ 0.24 window heights of scrolling (`SCROLL_PER_SECOND` in `Film.tsx`).
  Midnight is ~64 s ≈ 15 screens. Under ~40 s feels thin; over ~80 s starts to drag.
- A chapter is typically 4–7 s: ~1–1.5 s of transition in, the action, then a **hold of
  ~1 s** at the end so the viewer can read the caption before the next transition starts.
- Busy chapters (a stream, a form being filled) can run 10–14 s. Split them if they go longer.
- Captions come in *after* the camera settles (~0.5–1 s into the chapter) and leave as the
  next transition starts.

## 7. Mining the product

If the product's code is in the repo:
- **Tokens**: copy its theme variables into `styles/tokens.css`. Match its easing tokens.
- **Components**: rebuild the key ones at stage size (a card, a badge, the main detail page).
  Don't import the real components; they bring layout and state you don't want. Copy the
  CSS values so it looks identical.
- **Data**: use its mock data's names, IDs and numbers. In-jokes in the data (Midnight's Star
  Wars world) are gold for a story.
