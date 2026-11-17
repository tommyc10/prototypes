import { BookOpenTextIcon, BotIcon, BracesIcon, HammerIcon } from "lucide-react"

import { Badge } from "@/components/badge"
import { StatusDot } from "@/components/status-dot"
import { C, Code, Entry, Lesson, Section, Spec, Trace, Why } from "@/showcase/lib/doc"

const RULES: [string, string][] = [
  ["Greys only.", "Colour appears only when it means a status: green active, amber proposed, orange warning, red danger."],
  ["Depth is a ladder of six greys.", "l0 is the heaviest (the sidebar), l5 the lightest (hover). To lift something, step up one rung."],
  ["Edges are white at 7 to 18% opacity.", "Drawn as a 1px inset box-shadow, so they sit on any surface and take no space."],
  ["Cards catch light on their top edge.", "A second inset shadow, 1px tall and almost invisible, is what stops them looking flat."],
  ["Anything floating is glass.", "A see-through tint, a blur of what is behind, a bright top edge, a ring and one big soft shadow."],
  ["Text has three tones.", "fg, fg-2, fg-3. Emphasis is weight 500 or 600, never a brighter colour. Big text gets tighter letter spacing."],
  ["One white thing per screen.", "The primary button is the only high-contrast element, so the eye lands on it."],
  ["Motion is short.", "120 to 240ms, easing out. Pressing shrinks a control to 97%. Hover moves one rung up the ladder."],
]

export function Start({ n }: { n: (id: string) => string }) {
  const paths = [
    {
      icon: BookOpenTextIcon,
      title: "I want to understand it",
      body: `Read section ${n("anatomy")}, then the six foundations in order. Every idea has a live demo and a note marked Lesson that says why it is that way.`,
      href: "#anatomy",
      go: `Start at ${n("anatomy")}`,
    },
    {
      icon: BotIcon,
      title: "I want an agent to match it",
      body: `Give the agent DESIGN.md and one of the prompts in section ${n("handoff")}. The checklist there is how you tell whether it listened.`,
      href: "#handoff",
      go: `Go to ${n("handoff")}`,
    },
    {
      icon: HammerIcon,
      title: "I want to build my own",
      body: `Section ${n("build")} is the method this system was made with, as eight steps you can repeat on any product, with exercises.`,
      href: "#build",
      go: `Go to ${n("build")}`,
    },
    {
      icon: BracesIcon,
      title: "I am changing the product",
      body: "Imperial Ops itself is plain CSS. Six sections teach its own classes, with the markup to write and a stylesheet you can edit in place.",
      href: "#css-type",
      go: `Go to ${n("css-type")}`,
    },
  ]
  return (
    <header id="start" data-section className="scroll-mt-6 pt-14">
      <Badge>
        <StatusDot status="active" size="sm" />
        Tailwind edition · no component library
      </Badge>
      <h1 className="type-display mt-3 mb-2.5">The Imperial Ops design system</h1>
      <p className="mb-2.5 max-w-[68ch] text-base leading-[1.6] text-pretty text-fg-2 md:text-[15px]">
        Every decision that makes Imperial Ops look and behave the way it does, written down once: the colours,
        the type, the spacing, how a button answers a press, when something is allowed to be red.{" "}
        <strong className="font-medium text-fg">Everything on this page is the real thing</strong>, drawn by the
        same tokens and components you would build with, in dark and light.
      </p>
      <p className="max-w-[68ch] text-base leading-[1.6] text-pretty text-fg-2 md:text-[15px]">
        It comes in three parts. <C>DESIGN.md</C> is the contract an agent reads. This app is the system itself,
        built with Tailwind and nothing else, in a few short files you can read and copy. And the notes marked{" "}
        <strong className="font-medium text-fg">Lesson</strong> are for you: they explain how each part works, so
        you could have made it yourself.
      </p>

      <div className="mt-8 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {paths.map((path) => (
          <a
            key={path.title}
            href={path.href}
            className="surface-card group flex flex-col gap-2 p-4 transition-colors duration-150 hover:bg-l4"
          >
            <path.icon className="size-4 text-fg-3 transition-colors duration-150 group-hover:text-fg" />
            <div className="type-section">{path.title}</div>
            <p className="flex-1 text-sm leading-[1.55] text-fg-2">{path.body}</p>
            <span className="text-xs font-medium text-fg-2 transition-colors duration-150 group-hover:text-fg">{path.go} →</span>
          </a>
        ))}
      </div>

      <div className="mt-14">
        <div className="font-mono text-xs text-fg-3">{n("start")}</div>
        <h2 className="mt-1.5 mb-2 text-2xl leading-tight font-semibold tracking-[-0.025em]">The recipe, in eight rules</h2>
        <p className="max-w-[72ch] text-[15px] leading-[1.6] text-fg-2">
          If you remember only this you can already build something that belongs. The rest of the page is these
          eight rules, made exact.
        </p>
        <ol className="mt-6 grid gap-x-10 lg:grid-cols-2">
          {RULES.map(([head, body], i) => (
            <li key={head} className="grid grid-cols-[22px_minmax(0,1fr)] gap-3 border-t py-3.5 leading-[1.6] text-fg-2">
              <span className="pt-0.5 font-mono text-xs text-fg-3">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <strong className="font-medium text-fg">{head}</strong> {body}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </header>
  )
}

const LAYERS = [
  {
    name: "Tokens",
    what: "Raw values, named for what they are.",
    eg: "--l3: #161616\n--line: rgba(255,255,255,.07)",
    q: "What exists?",
  },
  {
    name: "Recipes",
    what: "The moves you repeat, each given one name.",
    eg: "surface-card\nglass-bar · type-title",
    q: "What is it made of?",
  },
  {
    name: "Components",
    what: "Reusable pieces built only from recipes and tokens.",
    eg: '<Card>\n<Button variant="primary">',
    q: "What can I use?",
  },
  {
    name: "Patterns",
    what: "How pieces combine, and the rules for when.",
    eg: "List drives detail.\nOne primary action per view.",
    q: "How do I use it well?",
  },
]

const AUDIT = `# Run these in any project to see what its "system" really is.
cd imperial-ops   # the app, one folder up from design-system/
cat $(find src -name '*.css') > /tmp/all.css

# every font size, most used first
grep -oE 'font-size: *[^;]+' /tmp/all.css | sort | uniq -c | sort -rn

# the same question for radius, heights, durations and colours
grep -oE 'border-radius: *[^;]+' /tmp/all.css | sort | uniq -c | sort -rn
grep -oE '^ *height: *[0-9]+px'  /tmp/all.css | sort | uniq -c | sort -rn
grep -oE '[0-9]+ms'              /tmp/all.css | sort | uniq -c | sort -rn
grep -oE 'var\\(--[a-z0-9-]+'     /tmp/all.css | sort | uniq -c | sort -rn
grep -oE '#[0-9a-fA-F]{3,8}'     /tmp/all.css | sort | uniq -c | sort -rn`

export function Anatomy({ n }: { n: string }) {
  return (
    <Section
      id="anatomy"
      n={n}
      title="How a design system works"
      lede={
        <>
          A design system is not a component library and it is not a style guide. It is{" "}
          <strong className="font-medium text-fg">a set of decisions, made once, written where code can read them</strong>.
          Once a decision is written down, nobody (you, a teammate, an agent) has to make it again, and nobody can
          make it differently by accident. Every system is the same four layers.
        </>
      }
    >
      <div className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-line inset-ring inset-ring-line md:grid-cols-4">
        {LAYERS.map((layer, i) => (
          <div key={layer.name} className="flex flex-col gap-2 bg-l3 p-4">
            <span className="font-mono text-[11px] text-fg-3">Layer {i + 1}</span>
            <div className="type-card-title">{layer.name}</div>
            <p className="text-sm leading-normal text-fg-2">{layer.what}</p>
            <pre className="mt-auto rounded-lg bg-l1 px-3 py-2.5 font-mono text-xs leading-[1.7] whitespace-pre-wrap text-fg-2 inset-ring inset-ring-line">
              {layer.eg}
            </pre>
            <span className="text-xs text-fg-3">Answers: {layer.q}</span>
          </div>
        ))}
      </div>
      <Why
        items={[
          ["Each layer only talks to the ones below it.", "A component never contains a hex value; a pattern never restyles a component. That is the whole discipline."],
          ["Change flows upward for free.", "Edit one token and every recipe, component and screen built on it follows. Section 03 lets you try exactly that."],
          ["The lower the layer, the fewer the things.", "Six greys and four status colours carry every component on this page. If a layer keeps growing, decisions are not being reused."],
          ["The names are the system.", "A value with no name gets retyped, and a retyped value drifts. Naming it is what makes it a decision."],
        ]}
      />

      <Entry
        title="Follow one colour all the way down"
        desc={
          <>
            This is the single most useful thing to understand. Here is the grey of a card, traced from the
            component you type to the pixel on screen. Each step is one line in one file, and you can open every
            one of them.
          </>
        }
      >
        <Trace
          steps={[
            { layer: "Component", code: "<Card>", note: "You ask for a card. src/components/card.tsx" },
            { layer: "Recipe", code: "surface-card", note: "The component uses the recipe named for what a card is." },
            { layer: "Class", code: "bg-l3", note: "The recipe is ordinary Tailwind classes; this is its background." },
            { layer: "@theme", code: "--color-l3: var(--l3)", note: "index.css tells Tailwind which token that class reads." },
            { layer: "Token", code: "--l3: #161616", note: "The value. In .light the same name is #fafafa." },
          ]}
        />
        <Why
          items={[
            ["Why the recipe in the middle?", <>Because <C>surface-card</C> says what the thing <em>is</em>. If cards should one day sit on <C>l4</C> or lose their lit edge, you change the recipe once and every card follows. If each component spelled out its own four classes, you would be hunting through every file.</>],
            ["So when do I use bg-l3 directly?", <>Whenever there is no recipe for it: a hover, a code box, a one-off surface. It is always safe, because it is still a token and never a hex.</>],
            ["Why var() and not the hex in @theme?", <>So themes can be nested. A <C>.light</C> band inside a dark page redefines <C>--l3</C>, and everything inside re-resolves on its own.</>],
            ["What does Tailwind add?", <>Only the translation from a token to a class. <C>--color-l3</C> in <C>@theme</C> becomes <C>bg-l3</C>, <C>text-l3</C> and <C>inset-ring-l3</C>. The decisions are still yours; Tailwind saves the typing.</>],
          ]}
        />
      </Entry>

      <Entry
        title="This system was extracted, not invented"
        desc={
          <>
            Nobody sat down and chose a type scale. The app was built first, by eye, one page at a time, and the
            system is what you get when you count what was actually used and give the survivors names. Here is
            the real count from the app's CSS, and what each became.
          </>
        }
      >
        <Spec
          mono={[]}
          head={["Decision", "Found in the app", "What the system names", "What happened to the rest"]}
          rows={[
            ["Surfaces", "6 greys, already tokens (--l0 to --l5)", "6: the ladder", "Nothing to do. This is what done looks like."],
            ["Font sizes", "27 different values", "12 type styles", "11.5, 12.5 and 13.5px are the nearest whole step drawn twice: listed under Known gaps."],
            ["Font weights", "3 (400, 500, 600)", "3", "Already disciplined. No 700 anywhere."],
            ["Corner radii", "12 values", "7 and a pill", "8px folds into 9px. 2, 3 and 5px are chart marks only."],
            ["Control heights", "30 values", "12 named heights", "The rest are one-off chart and layout sizes, not controls."],
            ["Durations", "22 values", "7", "Everything over 320ms belongs to data stories, not the interface."],
            ["Easing curves", "3, already tokens", "3", "ease-out is used 44 times, in-out once."],
            ["Colours", "Every colour is a var(), bar a few status rgba()s", "4 status colours and their washes", "Hand-typed rgba(240, 86, 92, 0.35) becomes ring-red/35."],
          ]}
        />
        <Code title={<><b>The audit</b> · the six commands that produced that table</>} code={AUDIT} />
        <Lesson title="Extract first. A system you invent is a guess; a system you extract is a fact.">
          <p>
            The most common mistake is to start a design system from a blank page: pick a nice type scale, a
            12-step colour ramp, an 8-point grid, then try to build with it. It feels rigorous and it almost
            never fits, because the decisions were made before there was anything to decide about.
          </p>
          <p>
            Do it the other way round. <b>Build two or three real screens by eye first.</b> Then count. The values
            you reached for again and again are your system; the ones you used once are noise. A value used 104
            times (12px) is a law. A value used once (14.5px) is a typo.
          </p>
          <p>
            Your job in the audit is to be a strict editor, not an inventor: merge near-duplicates, give each
            survivor a name that says what it is for, and write down the ones you could not merge so the next
            person knows they are debt and not design.
          </p>
        </Lesson>
      </Entry>

      <Entry title="Where everything lives" desc="Two codebases carry the same system. The product is plain CSS; this app is the same decisions written as Tailwind classes.">
        <Spec
          head={["File", "Layer", "What is in it"]}
          rows={[
            ["imperial-ops/DESIGN.md", "All four, in words", "The contract. Tokens as YAML, then the rules, the do's and don'ts and the known gaps."],
            ["imperial-ops/src/styles/theme.css", "Tokens", "The product's tokens, on .mn. The original."],
            ["imperial-ops/src/styles/ui.css", "Components", "The product's shared pieces as plain CSS classes (mn-btn, mn-tab)."],
            ["src/index.css (this app)", "Tokens, scales, recipes", "The whole theme in one file, in the order a system is built."],
            ["src/components/*.tsx", "Components", "Seventeen short files, hand-written: button, badge, tabs, field, card, table, overlays, palette, toast, skeleton and the rest."],
            ["src/showcase/sections/*.tsx", "Patterns", "This page. Every demo is ordinary code you can copy."],
            ["src/showcase/product-css/data.ts", "Lessons", "The product's plain CSS, one editable stylesheet per piece: the In plain CSS sections."],
          ]}
        />
      </Entry>
    </Section>
  )
}
