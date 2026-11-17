import { TriangleAlertIcon } from "lucide-react"

import { Badge } from "@/components/badge"
import { StatusDot } from "@/components/status-dot"
import { ColorPair } from "@/showcase/lib/color-pair"
import { C, Entry, Example, Lesson, Section, Spec, Why } from "@/showcase/lib/doc"
import { LiveCss } from "@/showcase/lib/live-css"
import { Swatch } from "@/showcase/lib/swatch"

const SHEET = `/* This block is live for the whole page. Things to try:
   - change --l3 to #1d2330 and every card turns blue-grey
   - raise --line to 0.2 to see every hairline at once
   - change --primary to #45c47a: the one white thing is now green
   - set --fg-3 to #9a9a9a and watch the contrast figures above pass */
.dark {
  /* surfaces: the ladder, heaviest first */
  --l0: #050505; /* sidebar */
  --l1: #0b0b0b; /* list pane, code blocks */
  --l2: #101010; /* the page */
  --l3: #161616; /* cards */
  --l4: #1c1c1c; /* raised controls, selected rows */
  --l5: #242424; /* hover on a raised control */

  /* edges: white, at three strengths */
  --line: rgba(255, 255, 255, 0.07);
  --line-2: rgba(255, 255, 255, 0.11);
  --line-3: rgba(255, 255, 255, 0.18);

  /* text: three tones */
  --fg: #ededed;
  --fg-2: #a3a3a3;
  --fg-3: #737373;

  /* status: the only colour on the page */
  --green: #45c47a;
  --amber: #e0a93e;
  --orange: #f08a4b;
  --red: #f0565c;

  /* the accent */
  --primary: #fafafa;
  --primary-fg: #0a0a0a;
}`

const PAIRS: { name: string; use: string; bg: string; fg: string }[] = [
  { name: "Page", use: "Everything you read", bg: "l2", fg: "fg" },
  { name: "Card", use: "Text on a card", bg: "l3", fg: "fg" },
  { name: "Primary", use: "The one white button", bg: "primary", fg: "primary-fg" },
  { name: "Raised", use: "The everyday button", bg: "l4", fg: "fg" },
  { name: "Sentences on a card", use: "fg-2 one rung up", bg: "l3", fg: "fg-2" },
  { name: "Sentences on the page", use: "fg-2: body copy", bg: "l2", fg: "fg-2" },
  { name: "Labels on the page", use: "fg-3: meta, placeholders", bg: "l2", fg: "fg-3" },
  { name: "Labels on a card", use: "fg-3 one rung up", bg: "l3", fg: "fg-3" },
  { name: "Sidebar", use: "Nav text at rest", bg: "l0", fg: "fg-2" },
  { name: "Danger", use: "Red text on the page", bg: "l2", fg: "red" },
  { name: "Danger on its wash", use: "Callout sentences", bg: "red-wash", fg: "red-text" },
  { name: "Warning", use: "Orange text on the page", bg: "l2", fg: "orange" },
]

function Pairs() {
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-4">
      {PAIRS.map((pair) => (
        <ColorPair key={pair.name} name={pair.name} use={pair.use} background={pair.bg} foreground={pair.fg} />
      ))}
    </div>
  )
}

export function Colour({ n }: { n: string }) {
  return (
    <Section
      id="colour"
      n={n}
      title="Colour"
      lede={
        <>
          Almost everything is grey. That is a decision, not a lack of one: when the page is quiet, the single
          amber dot or red number is impossible to miss. Every colour is a CSS variable, declared once in{" "}
          <C>src/index.css</C>. Every line under a swatch copies when you click it: the raw value, the CSS to
          write in a stylesheet, a Tailwind class that works in any project, and the shorter class this theme
          gives you.
        </>
      }
    >
      <Entry
        title="The ladder: six surfaces"
        desc={
          <>
            Depth is not shadows, it is which grey you are standing on. Each rung is about six hex points from
            the next, so you feel the layers more than you see them. <strong className="font-medium text-fg">To
            lift something, step up one rung.</strong>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
          <Swatch token="l0" use="Sidebar: the heaviest material" cls="bg-l0" />
          <Swatch token="l1" use="List pane, code blocks" cls="bg-l1" />
          <Swatch token="l2" use="The page itself" cls="bg-l2" />
          <Swatch token="l3" use="Cards" cls="bg-l3" />
          <Swatch token="l4" use="Raised controls, selected rows" cls="bg-l4" />
          <Swatch token="l5" use="Hover on a raised control" cls="bg-l5" />
        </div>
      </Entry>

      <Entry
        title="Edges and text: three strengths each"
        desc="Lines are white at low opacity, so one token is always a little lighter than whatever it sits on. Text has three tones and nothing is ever brighter than the first."
      >
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          <Swatch kind="line" token="line" use="Dividers, card rings" cls="border-line" />
          <Swatch kind="line" token="line-2" use="Buttons, fields, floating things" cls="inset-ring-line-2" />
          <Swatch kind="line" token="line-3" use="A focused field, chart baselines" cls="inset-ring-line-3" />
          <Swatch kind="text" token="fg" use="What you read" cls="text-fg" />
          <Swatch kind="text" token="fg-2" use="Supporting sentences" cls="text-fg-2" />
          <Swatch kind="text" token="fg-3" use="Labels, meta, placeholders" cls="text-fg-3" />
        </div>
      </Entry>

      <Entry
        title="Status: the only colour"
        desc="Four colours, each with one meaning. It goes on the smallest thing that carries the meaning (a dot, a number, a pill), never on a card's background or a heading, and never without a word, an icon or a change of shape."
      >
        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
          <Swatch kind="status" token="green" use="Active, validated, caught by a rule" cls="text-green" />
          <Swatch kind="status" token="amber" use="Proposed, waiting for a decision" cls="text-amber" />
          <Swatch kind="status" token="orange" use="Warning: low confidence, running late" cls="text-orange" />
          <Swatch kind="status" token="red" use="Danger: a real incident, reject" cls="text-red" />
        </div>
        <Example label="The same four, as they appear: a dot in a row, a pill in a header, a number in a card">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <span className="flex items-center gap-3">
              <StatusDot status="active" /> <StatusDot status="proposed" /> <StatusDot status="warning" />{" "}
              <StatusDot status="danger" /> <StatusDot status="inactive" />
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Validated</Badge>
              <Badge variant="pending">Proposed</Badge>
              <Badge variant="warning">Needs review</Badge>
              <Badge variant="danger">Unsafe</Badge>
            </span>
            <span className="flex items-baseline gap-5">
              <span className="type-stat">94%</span>
              <span className="type-stat flex items-center gap-1.5 text-orange">
                <TriangleAlertIcon className="size-4" />
                47%
              </span>
              <span className="type-stat text-red">3</span>
            </span>
          </div>
        </Example>
        <Why
          items={[
            ["The pill formula.", <>The colour at about 10% as the fill, 22% as the ring, 100% as the text. In Tailwind that is three classes: <C>bg-green/10 inset-ring-green/22 text-green</C>.</>],
            ["Amber is not a warning.", <>Amber means "waiting for you". Orange means "careful". Keeping them apart is what lets a person scan a list of twenty rules and know which eight need a decision.</>],
          ]}
        />
      </Entry>

      <Entry
        title="Materials: glass, washes and wells"
        desc="These are the same greys with an opacity, so whatever is behind shows through. The swatches sit on a colourful strip so you can see how much each lets past."
      >
        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
          <Swatch kind="glass" token="glass" use="Action bar, decision form" cls="glass-bar" />
          <Swatch kind="glass" token="glass-menu" use="Menus, popovers" cls="glass-menu" />
          <Swatch kind="glass" token="glass-palette" use="Command palette: thinnest tint" cls="glass-palette" />
          <Swatch kind="glass" token="glass-toast" use="Toast" cls="glass-toast" />
        </div>
      </Entry>

      <Entry
        title="Pairs, with measured contrast"
        desc={
          <>
            A palette tells you what colours exist. A <strong className="font-medium text-fg">pair</strong>{" "}
            tells you whether you can read one on the other. Each tile below is a surface with its text colour
            on it, and the number is measured live by the browser: 4.5 or more passes WCAG AA for body text,
            3 or more passes for large text.
          </>
        }
      >
        <Pairs />
        <div className="light rounded-3xl bg-l2 p-5 text-fg inset-ring inset-ring-line">
          <div className="mb-3 font-mono text-xs text-fg-3">
            The same pairs inside a <span className="text-fg">.light</span> band: same components, same token names, new values
          </div>
          <Pairs />
        </div>
        <Why
          items={[
            ["A real finding: fg-3 fails for small text in dark.", <>Labels at <C>#737373</C> measure about 4.0 on the page and less on a card. The product uses it only for labels and meta, never for a sentence you need, and <C>prefers-contrast: more</C> lifts it. It is written down in DESIGN.md under Known gaps so nobody "fixes" it by accident or spreads it by accident.</>],
            ["Primary inverts between themes.", "White on near-black in dark, near-black on white in light. The role stays 'the one high-contrast thing'; only the value flips."],
          ]}
        />
      </Entry>

      <Entry
        title="The token sheet"
        desc="The proof that the layers work. This box is a real stylesheet. Change a value and every component on the page that depends on it follows, because none of them holds a colour of its own."
      >
        <LiveCss title={<><b>index.css</b> · the dark tokens</>} css={SHEET} />
      </Entry>

      <Lesson title="How to choose colours for a system of your own">
        <ol>
          <li>
            <b>Start with surfaces, not brand colours.</b> Decide how many layers your layout really has (here:
            sidebar, list, page, card, raised, hover) and give each a rung. Even steps matter more than the
            exact greys.
          </li>
          <li>
            <b>Make edges and washes transparent.</b> A solid border colour only looks right on one background.
            White or black at a low opacity looks right on all of them, which means one token instead of six.
          </li>
          <li>
            <b>Three text tones is enough.</b> Read, support, label. If you want a fourth you are usually trying
            to fix hierarchy with colour when it should be size or weight.
          </li>
          <li>
            <b>Give every colour a meaning, then refuse every other use.</b> The moment green also means "this
            is a link", it stops meaning "active".
          </li>
          <li>
            <b>Measure, then write down what fails.</b> Put each text colour on each surface it will sit on and
            read the number. A failing pair is not always wrong, but it must be a decision, not an accident.
          </li>
        </ol>
      </Lesson>
    </Section>
  )
}

const TYPE: { cls: string; spec: string; use: string; sample: React.ReactNode }[] = [
  { cls: "type-hero", spec: "88 / 0.86 / 600 / -0.055em", use: "One headline figure per report", sample: "66%" },
  { cls: "type-title", spec: "26 / 1.2 / 600 / -0.025em", use: "Page title", sample: "Superlaser pre-charge sequence warnings" },
  { cls: "type-chapter", spec: "20 / 1.25 / 600 / -0.02em", use: "List title, chapter heading", sample: "Where the noise came from" },
  { cls: "type-lead", spec: "17 / 1.62 / 400 / -0.005em", use: "A report's opening paragraph", sample: <>Rules would have caught <b className="font-medium text-fg">two thirds</b> of it.</> },
  { cls: "type-card-title", spec: "15 / 1.35 / 600 / -0.01em", use: "A card's or form's title", sample: "Approve this rule" },
  { cls: "type-section", spec: "14 / 1.4 / 600 / -0.005em", use: "A section heading in a page", sample: "Evidence" },
  { cls: "type-body", spec: "14 / 1.6 / 400", use: "Sentences. Stop at 68ch.", sample: "Pre-charge warnings appear on every firing sequence." },
  { cls: "type-control", spec: "13 / 1.4 / 500", use: "Buttons, tabs, rows, menu items", sample: "Approve · Proposed 8 · Sort by confidence" },
  { cls: "type-meta", spec: "12 / 1.35 / 400", use: "Labels, meta lines, timestamps", sample: "rolling 90 days · 28 Sept" },
  { cls: "type-micro", spec: "11 / 1.3 / 500", use: "Chips, key caps, axis labels", sample: "Below 60% · This week" },
  { cls: "type-id", spec: "Mono 12 / 1.35", use: "Identifiers and code", sample: "RUL-0435 · INC-40355" },
  { cls: "type-stat", spec: "26 / 1.1 / 600 / -0.03em", use: "The number in a stat card", sample: "14,568" },
  { cls: "type-stat-sm", spec: "20 / 1.25 / 600 / -0.02em", use: "A number under a sentence that already gives the answer", sample: "1,118" },
]

export function Type({ n }: { n: string }) {
  return (
    <Section
      id="type"
      n={n}
      title="Type"
      lede={
        <>
          One family, Geist, at a 14px base, with Geist Mono for identifiers. Hierarchy comes from size, weight
          and tone together, never from colour. Two habits make it look designed:{" "}
          <strong className="font-medium text-fg">letter spacing goes negative as text gets bigger</strong>, and{" "}
          <strong className="font-medium text-fg">numbers use tabular figures</strong> wherever they sit in a column.
        </>
      }
    >
      <Entry
        title="The scale: thirteen styles"
        desc={
          <>
            Each row is drawn by the class in its first column. They are named for the job, not the size: you
            reach for <C>type-title</C>, not "26 pixels". Spec reads size / line height / weight / tracking.
          </>
        }
      >
        <div className="rounded-2xl bg-l3 px-4 inset-ring inset-ring-line">
          {TYPE.map((row, i) => (
            <div
              key={row.cls}
              className={`grid items-center gap-x-6 gap-y-1 py-3.5 lg:grid-cols-[150px_210px_minmax(0,1fr)] ${i ? "border-t" : ""}`}
            >
              <code className="font-mono text-xs text-fg">{row.cls}</code>
              <div className="text-xs leading-normal text-fg-3">
                <div className="font-mono text-[11px]">{row.spec}</div>
                {row.use}
              </div>
              <div className={`${row.cls} min-w-0 truncate`}>{row.sample}</div>
            </div>
          ))}
        </div>
      </Entry>

      <Entry title="In running text" desc="How the styles sit together. The numbers that matter are fg at weight 600 inside an fg-2 sentence: emphasis by weight, not brightness.">
        <Example col>
          <div className="type-id">HC-2026-W39</div>
          <h3 className="type-title">All services</h3>
          <p className="type-lead max-w-[68ch]">
            Over the last <b className="font-semibold text-fg">8 completed weeks</b>, operators cancelled{" "}
            <b className="font-semibold text-fg">2,049</b> of 14,568 tickets by hand. Replayed against the
            suppression logic that is live today, <b className="font-semibold text-fg">1,360</b> of them would
            never have reached a person.
          </p>
          <h4 className="type-section mt-2">Evidence</h4>
          <p className="type-body max-w-[68ch]">
            Pre-charge warnings appear on every firing sequence. The sample is small and a quarter of the
            incidents were worked by engineers, so read <C>RUL-0435</C> before approving it.
          </p>
          <p className="type-meta">Median clear 14 min · Recurrence: firing sequences · Created 28 Sept</p>
        </Example>
      </Entry>

      <Entry title="The rules that are not sizes" desc="Small properties that do most of the work.">
        <Spec
          mono={[1]}
          head={["Habit", "CSS", "Tailwind", "Why"]}
          rows={[
            ["Tighter as it grows", "letter-spacing: -0.025em", "tracking-[-0.025em]", "Large type has too much air between letters at the default. Use em so it scales with the size."],
            ["Numbers line up", "font-variant-numeric: tabular-nums", "tabular-nums", "Every digit takes the same width, so columns align and a ticking number does not wobble."],
            ["Readable line length", "max-width: 68ch", "max-w-[68ch]", "ch is the width of a '0'. The paragraph stays readable however wide the pane gets."],
            ["Even headings", "text-wrap: balance", "text-balance", "Splits a two-line heading into two similar lines instead of one long and one orphan."],
            ["One line, then an ellipsis", "overflow: hidden; text-overflow: ellipsis; white-space: nowrap", "truncate", "Needs min-w-0 on its flex or grid parent, or it will never shrink."],
            ["Three weights only", "400, 500, 600", "font-normal, font-medium, font-semibold", "Sentences, controls and emphasis, headings and numbers. There is no bold."],
          ]}
        />
      </Entry>

      <Lesson title="How to build a type scale you will actually keep to">
        <p>
          A scale is not a list of sizes, it is a list of <b>jobs</b>. Write down every kind of text your product
          has (page title, row name, label, ID…) and give each one a full recipe: size, line height, weight,
          tracking and colour together. Twelve jobs is plenty for a dashboard.
        </p>
        <p>
          Then make the names the only door in. In this app <C>text-sm</C> is redefined to 13px and{" "}
          <C>text-base</C> to 14px inside <C>@theme</C>, so Tailwind's two most-used size classes already mean
          "control" and "body". The named styles are <C>type-*</C> utilities, so an agent that wants a page
          title has exactly one thing to reach for.
        </p>
        <p>
          The test of a good scale: you can delete the size column from the table above and still pick the right
          row every time.
        </p>
      </Lesson>
    </Section>
  )
}
