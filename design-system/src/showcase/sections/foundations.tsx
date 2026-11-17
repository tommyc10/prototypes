import * as React from "react"
import { PlayIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/button"
import { Kbd } from "@/components/kbd"
import { C, Code, Entry, Example, Lesson, Pair, Section, Spec, Why } from "@/showcase/lib/doc"
import { GlassPlayground } from "@/showcase/lib/glass-playground"
import { LiveCss } from "@/showcase/lib/live-css"
import { Prose, RecipeGrid } from "@/showcase/product-css/blocks"
import { GLASS_INGREDIENTS, RECIPES } from "@/showcase/product-css/data"

/* ---------------------------------- Space and size ---------------------------------- */

const GAPS: [string, number, string][] = [
  ["gap-px", 1, "Between nav items and stacked rows"],
  ["gap-0.5", 2, "Between tabs; inside a segmented track"],
  ["gap-1.5", 6, "An icon and its label"],
  ["gap-2", 8, "Inside a control; between buttons"],
  ["gap-2.5", 10, "Between cards in a row"],
  ["gap-3", 12, "Inside a list row; a title and its tools"],
  ["gap-4", 16, "Between groups"],
  ["mt-8", 32, "Between sections of a page"],
]

const HEIGHTS: [string, number, string][] = [
  ["h-[18px]", 18, "Key cap"],
  ["h-5", 20, "Chip"],
  ["h-5.5", 22, "Status pill"],
  ["h-6", 24, "Badge, xs button"],
  ["h-7", 28, "Tab, icon button"],
  ["h-8", 32, "Nav item"],
  ["h-8.5", 34, "Button, input"],
  ["h-9.5", 38, "Palette item"],
  ["h-13", 52, "Sticky bar"],
]

export function Space({ n }: { n: string }) {
  return (
    <Section
      id="space"
      n={n}
      title="Space and size"
      lede={
        <>
          Dense, not cramped. Everything is a multiple of 2px and most gaps are one of eight values. The more
          closely two things are related, the smaller the gap between them: that is the only rule spacing has.
        </>
      }
    >
      <Entry title="The spacing ladder" desc="Read it top to bottom as 'how related are these two things?'. Tailwind's numbers are multiplied by 4px, so gap-2 is 8px and gap-2.5 is 10px.">
        <div className="rounded-2xl bg-l3 px-4 py-1 inset-ring inset-ring-line">
          {GAPS.map(([cls, px, use], i) => (
            <div key={cls} className={cn("grid grid-cols-[84px_44px_120px_minmax(0,1fr)] items-center gap-3 py-2.5", i && "border-t")}>
              <code className="font-mono text-xs">{cls}</code>
              <span className="text-xs text-fg-3 tabular-nums">{px}px</span>
              <span className="h-2 rounded-[2px] bg-fg" style={{ width: px * 2 }} />
              <span className="text-sm text-fg-2">{use}</span>
            </div>
          ))}
        </div>
      </Entry>

      <Entry title="Control heights" desc="Things that sit in a row together share a height, so they line up without thinking. A button beside an input is always 34 beside 34.">
        <Example className="items-end gap-5">
          {HEIGHTS.map(([cls, px, use]) => (
            <figure key={cls} className="m-0 text-xs leading-snug text-fg-3">
              <span className="block w-16 rounded-sm bg-l4 inset-ring inset-ring-line-2" style={{ height: px }} />
              <b className="mt-2 block font-mono text-xs font-medium text-fg">{px}px</b>
              {use}
              <br />
              <span className="font-mono text-[11px]">{cls}</span>
            </figure>
          ))}
        </Example>
      </Entry>

      <Entry
        title="The shell: three columns, only the panes scroll"
        desc={
          <>
            Sidebar 240px, list 380px, detail takes the rest. The page itself never scrolls; each pane does.
            Floating things anchor to their <em>pane</em>, not the window, so the glass bar is always over the
            content it acts on.
          </>
        }
      >
        <Example className="h-72 gap-0 overflow-hidden p-0">
          <div className="grid size-full grid-cols-[18%_28%_1fr] text-xs text-fg-3">
            <div className="flex flex-col gap-1 border-r bg-l0 p-3">
              <span className="font-mono">l0 · 240px</span>
              {["Home", "Incidents", "Alerts", "Rules"].map((item, i) => (
                <span key={item} className={cn("flex h-6 items-center rounded-md px-2", i === 3 ? "bg-chip text-fg shadow-chip" : "text-fg-2")}>
                  {item}
                </span>
              ))}
            </div>
            <div className="flex min-h-0 flex-col border-r bg-l1">
              <span className="p-3 pb-2 font-mono">l1 · 380px · scrolls</span>
              <div className="scroll-fade flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-2 pb-3">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className={cn("h-9 shrink-0 rounded-lg", i === 1 ? "bg-chip shadow-chip inset-ring inset-ring-line" : "bg-l3/60")} />
                ))}
              </div>
            </div>
            <div className="relative flex min-h-0 min-w-0 flex-col">
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-5 pb-20">
                <span className="font-mono">l2 · 1fr · scrolls · content stops at 960px</span>
                <span className="h-5 w-2/3 rounded-sm bg-l4" />
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((i) => <span key={i} className="surface-card h-14" />)}
                </div>
                {[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-3 shrink-0 rounded-[2px] bg-l3" style={{ width: `${88 - i * 9}%` }} />)}
                <span className="surface-card h-24 shrink-0" />
                <span className="surface-card h-24 shrink-0" />
              </div>
              <div className="glass-bar absolute inset-x-4 bottom-4 flex h-11 items-center gap-2 pr-2 pl-4">
                <span className="flex-1 font-medium text-fg-2">absolute · anchored to this pane</span>
                <span className="h-7 w-20 rounded-md bg-primary" />
              </div>
            </div>
          </div>
        </Example>
        <Spec
          mono={[1]}
          head={["Part", "Tailwind", "What each bit does"]}
          rows={[
            ["The shell", "grid h-svh grid-cols-[240px_380px_minmax(0,1fr)] overflow-hidden", "Three fixed tracks that fill the window and never let it scroll. minmax(0,1fr) lets the last one shrink."],
            ["A pane", "relative flex min-h-0 min-w-0 flex-col", "A column that is allowed to be smaller than its content (the two min-0s), and that floating children can anchor to (relative)."],
            ["Its scrolling part", "min-h-0 flex-1 overflow-y-auto", "Takes the leftover height and scrolls inside it."],
            ["Soft scroll edges", "scroll-fade", "A mask-image gradient: rows fade out under the header instead of hitting a line."],
            ["The floating bar", "glass-bar absolute inset-x-6 bottom-20", "Out of the flow, 24px from the pane's sides."],
            ["Layout by pane width", "@container/report, then @min-[980px]/report:grid-cols-2", "A container query: children answer to the pane's width, not the window's, so tucking the sidebar away can tip the page into two columns."],
          ]}
        />
      </Entry>

      <Lesson title="Spacing is a statement about relationships">
        <p>
          Before you pick a number, ask what the gap is <b>saying</b>. An icon and its label are one thing
          (6px). Two buttons are siblings (8px). Two cards are neighbours (10px). Two sections are different
          subjects (32px). If you get the order right the layout reads correctly even when the exact values are
          a little off; if you get it wrong, no grid system will save it.
        </p>
        <p>
          To find your own ladder, do the audit from section 02 on <C>gap</C> and <C>padding</C>. You will find
          four or five values doing nearly all the work. Those are your scale. Tailwind makes this easy to keep:
          if you find yourself typing <C>gap-[7px]</C>, you have left the system.
        </p>
      </Lesson>
    </Section>
  )
}

/* ---------------------------------- Shape ---------------------------------- */

const RADII: [string, string, string][] = [
  ["rounded-xs", "4px", "Key caps, meters, checkboxes"],
  ["rounded-sm", "6px", "Menu items, the brand mark"],
  ["rounded-md", "7px", "Tabs, nav items, icon buttons"],
  ["rounded-lg", "9px", "Buttons, inputs, list rows, wells"],
  ["rounded-xl", "10px", "Text areas, callouts, code, menus"],
  ["rounded-2xl", "12px", "Cards, tables, toasts"],
  ["rounded-3xl", "14px", "Glass bars, palette, dialogs"],
  ["rounded-4xl", "pill", "Badges, dots, avatars"],
]

export function Shape({ n }: { n: string }) {
  return (
    <Section
      id="shape"
      n={n}
      title="Shape"
      lede="Seven radii and a pill. The rule is that radius follows size: the smaller the thing, the smaller its corner. Nothing is sharp and nothing is bubbly."
    >
      <Entry title="The radius ladder" desc="Tailwind's eight radius names are pinned to the Imperial Ops values in @theme, so rounded-lg always means 'a button's corner' and nobody has to remember 9px.">
        <Example className="items-end gap-5">
          {RADII.map(([cls, px, use]) => (
            <figure key={cls} className="m-0 w-[104px] text-xs leading-snug text-fg-3">
              <span className={cn("block size-16 bg-l3 inset-shadow-edge inset-ring inset-ring-line-2", cls)} />
              <b className="mt-2 block font-mono text-xs font-medium text-fg">{px}</b>
              <span className="font-mono text-[11px]">{cls}</span>
              <br />
              {use}
            </figure>
          ))}
        </Example>
      </Entry>

      <Entry title="Corners inside corners" desc="A child's radius is its parent's radius minus the padding between them. Then the two curves stay parallel, which is what makes nesting look deliberate.">
        <Pair>
          <Example label="Right: 9px track, 2px padding, 7px tab">
            <div className="flex gap-0.5 rounded-lg bg-well-2 p-0.5 inset-ring inset-ring-line">
              <span className="flex h-10 items-center rounded-md bg-chip px-6 text-sm font-medium shadow-chip inset-ring inset-ring-line">Brief</span>
              <span className="flex h-10 items-center px-6 text-sm font-medium text-fg-3">Board</span>
            </div>
          </Example>
          <Example label="Wrong: the same radius inside and out pinches at the corner">
            <div className="flex gap-0.5 rounded-lg bg-well-2 p-0.5 inset-ring inset-ring-line">
              <span className="flex h-10 items-center rounded-2xl bg-chip px-6 text-sm font-medium shadow-chip inset-ring inset-ring-line">Brief</span>
              <span className="flex h-10 items-center px-6 text-sm font-medium text-fg-3">Board</span>
            </div>
          </Example>
        </Pair>
        <Code
          title={<><b>index.css</b> · pinning the scale</>}
          code={`@theme inline {
  /* Tailwind name -> Imperial Ops value -> who uses it */
  --radius-xs: 4px;     /* key caps, meters, checkboxes */
  --radius-sm: 6px;     /* menu items, the brand mark */
  --radius-md: 7px;     /* tabs, nav items, icon buttons */
  --radius-lg: 9px;     /* buttons, inputs, list rows, wells */
  --radius-xl: 10px;    /* text areas, callouts, code blocks, menus */
  --radius-2xl: 12px;   /* cards, tables, toasts */
  --radius-3xl: 14px;   /* glass bars, the palette, dialogs */
  --radius-4xl: 9999px; /* pills, dots, avatars */
}`}
        />
      </Entry>

      <Lesson title="Keep the framework's names, replace its values">
        <p>
          Tailwind ships with its own radius scale (4, 6, 8, 12, 16…). It is a fine general scale and it is
          not this product's: the ladder here goes 4, 6, 7, 9, 10, 12, 14. So eight lines in <C>@theme</C>{" "}
          re-point Tailwind's names at the house values.
        </p>
        <p>
          That is better than inventing new names, and much better than writing <C>rounded-[9px]</C>{" "}
          everywhere. Everyone (and every agent) already knows <C>rounded-lg</C>; you only decide what "lg"
          means here. The same trick moved <C>text-sm</C> to 13px and <C>ease-out</C> to the house curve.
        </p>
      </Lesson>
    </Section>
  )
}

/* ---------------------------------- Materials ---------------------------------- */

const EDGE = `/* Edit me. This draws the box on the left. */
.demo-edge {
  background: var(--l3);
  border-radius: 12px;

  /* The edge is a shadow, not a border. Two layers, comma separated:
     1. inset 0 1px 0   a 1px line along the TOP only: the lit edge
     2. inset 0 0 0 1px a 1px ring all the way round
     'inset' draws them inside the box, so the box does not grow. */
  box-shadow:
    inset 0 1px 0 var(--card-edge),
    inset 0 0 0 1px var(--line);

  /* Try: change --line to --line-3, or delete the first layer,
     or swap both for  border: 1px solid var(--line);  and watch
     the box get 2px bigger. */
}`

export function Materials({ n }: { n: string }) {
  return (
    <Section
      id="materials"
      n={n}
      title="Materials"
      lede={
        <>
          There are five materials, and you pick one by what the thing <em>is</em>, not by how you want it to
          look. Something that sits on the page is a card. Something sunk into it is a well. Something you have
          chosen is raised. Something that floats over the page is glass. Only floating things cast a shadow.
        </>
      }
    >
      <Entry title="The five, side by side" desc="Each is one utility class. They are only bundles of ordinary Tailwind classes (see RECIPES in index.css), so you can always write them out by hand.">
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-5">
          {[
            ["Flat", "bg-l1", "A ladder rung and a 1px border between panes.", "bg-l1 border-r"],
            ["Card", "surface-card", "A rung up, a hairline ring, a lit top edge.", "surface-card"],
            ["Well", "surface-well", "Darker than what it sits in. Tracks, fields, metric strips.", "surface-well"],
            ["Raised", "surface-raised rounded-lg", "One more rung, with a ring. Selected rows, active tabs.", "surface-raised"],
          ].map(([name, cls, what, code]) => (
            <div key={name} className="flex flex-col gap-2">
              <div className={cn("grid h-24 place-items-center text-sm font-medium text-fg-2", cls, name === "Flat" && "rounded-lg border-r")}>{name}</div>
              <code className="font-mono text-xs">{code}</code>
              <p className="text-xs leading-normal text-fg-2">{what}</p>
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <div className="grid h-24 place-items-center rounded-lg bg-[linear-gradient(100deg,var(--green),var(--amber)_45%,var(--red))] p-3">
              <div className="glass-bar grid size-full place-items-center rounded-lg! text-sm font-medium text-fg-2">Glass</div>
            </div>
            <code className="font-mono text-xs">glass-bar</code>
            <p className="text-xs leading-normal text-fg-2">Floats. A tint, a blur, a lit edge, a ring and the only drop shadow.</p>
          </div>
        </div>
      </Entry>

      <Entry
        title="The edge: an inset ring, not a border"
        desc={
          <>
            Almost every outline in the product is a <C>box-shadow</C>. A border takes up space and has one
            colour; an inset shadow takes none, stacks in layers, and sits happily on any surface.
          </>
        }
      >
        <Pair>
          <Example className="min-h-56 justify-center">
            <div className="demo-edge grid h-28 w-56 place-items-center text-sm text-fg-2">.demo-edge</div>
          </Example>
          <LiveCss title={<><b>The card edge</b> · two inset shadows</>} css={EDGE} />
        </Pair>
        <Spec
          mono={[0, 1]}
          head={["In Tailwind", "CSS it writes", "Use"]}
          rows={[
            ["inset-ring inset-ring-line", "box-shadow: inset 0 0 0 1px var(--line)", "The ring on almost everything"],
            ["inset-ring-line-2", "…var(--line-2)", "When the edge has to carry the shape alone: buttons, fields"],
            ["inset-shadow-edge", "box-shadow: inset 0 1px 0 var(--card-edge)", "The lit top edge of a card"],
            ["inset-shadow-glass", "box-shadow: inset 0 1px 0 var(--glass-edge)", "The brighter lit edge of glass"],
            ["ring-1 ring-line-2", "box-shadow: 0 0 0 1px var(--line-2)", "An outer ring, for floating things (it must sit outside the blur)"],
            ["border-t", "border-top: 1px solid var(--line)", "A divider between rows. The one place a real border is right."],
          ]}
        />
      </Entry>

      <Entry title="Glass, four strengths" desc="The thinner the tint, the heavier the blur has to be to keep text readable. Scroll the strip behind each to see the blur working.">
        <div className="grid gap-2.5 md:grid-cols-2">
          {[
            ["glass-bar", "Action bar, decision form", "78% · blur 20 · saturate 1.2"],
            ["glass-menu rounded-xl", "Menus and popovers", "86% · blur 16 · saturate 1.2"],
            ["glass-palette", "Command palette", "60% · blur 40 · saturate 1.8"],
            ["glass-toast", "Toast", "88% · blur 20"],
          ].map(([cls, use, spec]) => (
            <div key={cls} className="relative h-36 overflow-hidden rounded-3xl inset-ring inset-ring-line">
              <div className="absolute inset-0 overflow-y-auto p-4 [scrollbar-width:none]">
                <div className="text-lg font-semibold tracking-[-0.02em]">Reactor Core</div>
                {["bg-green", "bg-amber", "bg-red", "bg-orange", "bg-green"].map((tone, i) => (
                  <div key={i} className={cn("mt-2.5 h-12 rounded-2xl", tone)} />
                ))}
              </div>
              <div className={cn("absolute inset-x-4 bottom-4 flex h-12 items-center justify-between gap-3 px-4 text-sm", cls)}>
                <span className="font-medium text-fg">{use}</span>
                <span className="font-mono text-[11px] text-fg-2">{spec}</span>
              </div>
            </div>
          ))}
        </div>
        <Why
          items={[
            ["Why does glass need all five parts?", "The tint makes text readable. The blur stops what is behind from competing. The lit edge and ring give it a boundary, because a blurred shape has none. The shadow says it is above the page."],
            ["Why saturate()?", "Blurring mixes colours towards grey mud. Boosting saturation before the blur keeps whatever is behind as soft colour instead."],
            ["Tooltips and dialogs are solid.", "A tooltip sits on chart marks, and bright bars would wash through it. A dialog is a place you work in, so it gets the page colour, a ring and the biggest shadow."],
            ["People can turn it off.", "Under prefers-reduced-transparency the four glass tokens become solid l4. One media query in index.css, because the components only ever asked for the token."],
          ]}
        />
      </Entry>

      <Entry
        title="Glass playground"
        desc="Glass is five ingredients. Drag the sliders, scroll the content behind the bar, and copy what comes out."
      >
        <GlassPlayground />
        <ul className="grid gap-x-10 lg:grid-cols-2">
          {GLASS_INGREDIENTS.map((item) => (
            <li key={item} className="border-t py-2.5 text-sm leading-[1.55] text-fg-2">
              <Prose html={item} />
            </li>
          ))}
        </ul>
        <div className="mt-3.5 text-xs font-medium text-fg-3">The glass surfaces in the app, ready to copy</div>
        <RecipeGrid items={RECIPES.glass} />
      </Entry>

      <Entry title="Elevation: what is allowed a shadow" desc="Three drop shadows exist and all three belong to floating things. If it sits on the page, it gets a ring, never a shadow.">
        <Example surface="l1" className="items-stretch gap-6 py-10">
          {[
            ["Card", "surface-card", "no shadow"],
            ["Menu, toast, tooltip", "rounded-xl bg-l4 ring-1 ring-line-2 inset-shadow-glass shadow-pop", "shadow-pop"],
            ["Action bar", "rounded-3xl bg-l4 ring-1 ring-line-2 inset-shadow-glass shadow-float", "shadow-float"],
            ["Palette, dialog", "surface-dialog", "shadow-palette"],
          ].map(([name, cls, shadow]) => (
            <div key={name} className={cn("flex h-24 min-w-40 flex-1 flex-col justify-end p-3.5", cls)}>
              <span className="text-sm font-medium">{name}</span>
              <span className="font-mono text-[11px] text-fg-3">{shadow}</span>
            </div>
          ))}
        </Example>
      </Entry>

      <Lesson title="Material is a decision about meaning, so make it once">
        <p>
          Without materials, every new component starts with "what background, what border, what shadow?" and
          three people give three answers. With them, the only question is <b>"what is this thing?"</b>, and the
          answer comes with a recipe.
        </p>
        <p>
          That is why they are utilities (<C>surface-card</C>, <C>glass-bar</C>) and not just documented
          values. When you find yourself writing the same four or five classes together for the third time,
          that group is a decision that has not been named yet. Name it in <C>@utility</C> and it joins the
          system.
        </p>
      </Lesson>
    </Section>
  )
}

/* ---------------------------------- Motion ---------------------------------- */

const CURVES: [string, string, string][] = [
  ["ease-out", "cubic-bezier(0.23, 1, 0.32, 1)", "Almost everything. Starts fast, so the interface feels like it answered at once."],
  ["ease-in-out", "cubic-bezier(0.77, 0, 0.175, 1)", "Something already on screen moving from A to B: the tour spotlight."],
  ["ease-drawer", "cubic-bezier(0.32, 0.72, 0, 1)", "Sheets and drawers: a long, soft landing."],
]

function CurveDemo() {
  const [at, setAt] = React.useState(false)
  return (
    <Example col className="gap-4">
      {CURVES.map(([cls, bezier, use]) => (
        <div key={cls} className="grid items-center gap-x-4 gap-y-1 md:grid-cols-[110px_minmax(0,1fr)_minmax(0,1.2fr)]">
          <code className="font-mono text-xs">{cls}</code>
          <div className="relative h-7 rounded-lg bg-well-2 inset-ring inset-ring-line">
            <span
              className="absolute top-1 left-1 size-5 rounded-sm bg-fg"
              style={{
                left: at ? "calc(100% - 24px)" : 4,
                transition: `left 600ms ${bezier}`,
              }}
            />
          </div>
          <span className="text-xs leading-normal text-fg-2">{use}</span>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => setAt((v) => !v)}>
          <PlayIcon /> Play all three
        </Button>
        <span className="text-xs text-fg-3">Slowed to 600ms so you can see the difference in shape.</span>
      </div>
    </Example>
  )
}

function ArriveDemo() {
  const [key, setKey] = React.useState(0)
  const [animate, setAnimate] = React.useState(true)
  return (
    <Example className="min-h-44 items-end">
      <div
        key={key}
        className={cn(
          "glass-bar flex w-full items-center gap-2 py-2.5 pr-2.5 pl-4.5",
          animate &&
            "transition-[opacity,translate,scale,filter] duration-[220ms] ease-out starting:translate-y-2 starting:scale-[0.99] starting:opacity-0 starting:blur-xs"
        )}
      >
        <span className="flex-1 text-sm font-medium text-fg-2">Every change needs a written reason</span>
        <Button variant="primary" size="sm">Approve <Kbd>A</Kbd></Button>
      </div>
      <div className="absolute top-4 left-4 flex gap-2">
        <Button size="sm" onClick={() => { setAnimate(true); setKey((k) => k + 1) }}>
          Open with the mouse
        </Button>
        <Button size="sm" onClick={() => { setAnimate(false); setKey((k) => k + 1) }}>
          Open with a key <Kbd>A</Kbd>
        </Button>
      </div>
    </Example>
  )
}

export function Motion({ n }: { n: string }) {
  return (
    <Section
      id="motion"
      n={n}
      title="Motion"
      lede={
        <>
          Motion here has one job: to show that the interface heard you. So it is short (120 to 240ms), it
          starts fast, and things you do a hundred times a day do not animate at all.
        </>
      }
    >
      <Entry title="The three curves" desc="A curve is the shape of the speed. All three are theme tokens, and Tailwind's own ease-out and ease-in-out have been replaced with the house curves, so the default is already right.">
        <CurveDemo />
      </Entry>

      <Entry title="How long things take" desc="Duration follows size: the further something travels, the longer it is allowed. Nothing in the interface is slower than 320ms.">
        <Spec
          mono={[0, 1]}
          head={["Duration", "Tailwind", "Used for"]}
          rows={[
            ["120ms", "duration-[120ms]", "Row hover: the list has to feel instant under a moving mouse"],
            ["150ms", "duration-150", "Colour changes: hover on tabs, links, nav items, buttons"],
            ["160ms", "duration-150", "Press: a button shrinking to 97%"],
            ["200ms", "duration-200", "A panel sliding in; the theme dissolve"],
            ["220ms", "duration-[220ms]", "The decision form arriving"],
            ["240ms", "duration-[240ms]", "The shell's columns opening and closing"],
            ["2000ms linear", "duration-[2000ms] ease-linear", "Hold to confirm. It is a timer, so it does not ease."],
          ]}
        />
      </Entry>

      <Entry
        title="Press, hover, arrive"
        desc={
          <>
            Three behaviours cover nearly everything. Press shrinks to 97%. Hover moves one rung up, and only
            for a real mouse. Arriving fades up 8px out of a slight blur, using <C>@starting-style</C>: the
            styles an element has for its very first frame.
          </>
        }
      >
        <Pair>
          <Example label="Press and hover: try them" className="min-h-44 justify-center">
            <Button>Deactivate <Kbd>D</Kbd></Button>
            <Button variant="primary">Approve <Kbd>A</Kbd></Button>
            <Button variant="danger">Reject <Kbd>X</Kbd></Button>
          </Example>
          <div>
            <div className="mb-1.5 font-mono text-xs text-fg-3">Arrive: animated for a pointer, instant for a key</div>
            <ArriveDemo />
          </div>
        </Pair>
        <Code
          title={<><b>The three behaviours</b> · as Tailwind classes</>}
          code={`/* press: the transition names only what changes */
transition-[scale,background-color] duration-150 ease-out active:scale-[0.97]

/* hover: one rung up. Tailwind only applies hover: on devices that can hover. */
bg-l4 hover:bg-l5

/* arrive: starting: is @starting-style, the element's first-frame styles */
transition-[opacity,translate,scale,filter] duration-[220ms] ease-out
starting:opacity-0 starting:translate-y-2 starting:scale-[0.99] starting:blur-xs`}
        />
        <Why
          items={[
            ["Only four things animate.", "transform (scale, translate), opacity, filter and colour. The browser can animate these without recalculating layout, so they stay smooth on a slow machine."],
            ["Keyboard-opened means instant.", "If you pressed A you already know what is coming; an animation would only make you wait. Pointer-opened things animate because your eye has to find them."],
            ["The command palette never animates.", "It is opened a hundred times a day. Anything used that often should feel like it was already there."],
            ["Reduced motion is honoured globally.", "One media query at the end of index.css removes movement for people who ask their system for less."],
          ]}
        />
      </Entry>

      <Lesson title="Decide whether it should move before deciding how">
        <p>Ask these in order, and stop at the first "no":</p>
        <ol>
          <li><b>Will the person see this more than a few times a minute?</b> Then do not animate it.</li>
          <li><b>Does the motion explain something?</b> Where a thing came from, that a press landed, that a list changed. If it only decorates, leave it out.</li>
          <li><b>Can it be done with transform and opacity?</b> If not, redesign it until it can.</li>
          <li><b>Now</b> pick a duration by distance and use the default curve.</li>
        </ol>
        <p>
          A system makes this cheap: there are seven durations and three curves to choose from, so "how" is a
          lookup. The thinking goes into "whether". The <C>animate</C> and <C>emil-design-eng</C> skills in the
          Imperial Ops repo walk through the same order.
        </p>
      </Lesson>
    </Section>
  )
}
