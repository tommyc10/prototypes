import design from "../../../DESIGN.md?raw"

import { Button } from "@/components/button"
import { C, Code, Entry, Lesson, Quiz, Section, Spec, Why, copy } from "@/showcase/lib/doc"
import { LiveCss } from "@/showcase/lib/live-css"

const PROMPT_BUILD = `Build the <Services> page for Imperial Ops.

Before writing any code, read DESIGN.md in the repo root from top to bottom. It is the
contract: every colour, size, radius, motion and interaction rule is in it. Then read
src/styles/theme.css and one existing page (src/pages/rule-management) to see the rules applied.

Requirements
- Same three-column shell as the other pages: sidebar, list, detail.
- Use only tokens from theme.css. No raw hex, no new radius, height or font size.
- Give the primary action a single key and show it on the button as a key cap.
- Build every state: empty, waiting, one item, many items, a 90-character name, an error.
- Keep the page self-contained under src/pages/services/ with model/types.ts, data/mockData.ts,
  hooks/ and components/, each component's CSS beside its .tsx.

When you think you are done, go through "Checklist before you say it is done" in DESIGN.md
and tell me the result of each line, including any you could not meet and why.`

const PROMPT_SHADCN = `I am building <a new tool> and want it to look and behave like Imperial Ops.
It uses React and Tailwind v4. Do not add a component library.

Use the design-system/ folder of the Imperial Ops repo as the starting point:
1. Copy src/index.css (the theme), src/components (the components) and src/lib/utils.ts
   into the new project, and install what they import: @base-ui/react, cmdk, sonner,
   lucide-react, @fontsource-variable/geist and @fontsource-variable/geist-mono.
2. Read DESIGN.md first. It is the contract for every colour, size and interaction rule.

Rules
- Build with the components and the recipes (surface-card, glass-bar, type-title).
  Reach for a token class (bg-l4, text-fg-3) when no recipe fits.
- Never write a raw colour, an arbitrary radius or an arbitrary font size.
- A plain <Button> is the everyday grey one. variant="primary" is the single main action
  on a view; never more than one.
- New components follow the pattern in button.tsx: a BASE string, a VARIANT lookup table,
  and className only for placement.
- If you need something the system does not have, stop and tell me what and why before adding it.`

const PROMPT_REVIEW = `Review this diff against DESIGN.md. Do not fix anything yet.

For each of the following, list every violation with file and line, or say "none":
1. A raw colour (hex, rgb, hsl, or a Tailwind palette class such as bg-zinc-800).
2. A radius, control height or font size that is not in the DESIGN.md scales.
3. Colour used for something that is not a status.
4. More than one primary button in a view.
5. A drop shadow on something that does not float.
6. An interactive element missing hover, pressed, focus-visible or disabled.
7. A primary action without a keyboard shortcut, or a shortcut that is not shown.
8. Text brighter than fg, weight 700, uppercase labels.
9. A missing state: empty, waiting, long text, error.

Then say, in one paragraph, whether this would be mistaken for part of the product.`

export function Handoff({ n }: { n: string }) {
  return (
    <Section
      id="handoff"
      n={n}
      title="Hand off to an agent"
      lede={
        <>
          An agent matches a design the same way a new teammate does: badly from a screenshot, well from
          written rules, and best from written rules plus working code to copy. This section is everything you
          need to give one, and how to check what comes back.
        </>
      }
    >
      <Entry title="What to give it" desc="Three things, in this order of importance.">
        <Spec
          mono={[]}
          head={["Give it", "Why", "Where"]}
          rows={[
            [<><b className="font-medium">DESIGN.md</b></>, "The contract. Tokens it can parse at the top, then the rules, the reasons, the do's and don'ts, and the honest list of gaps.", <C>imperial-ops/DESIGN.md</C>],
            ["Working code to copy", "A model copies a pattern far more reliably than it follows a description. Point it at one finished page, or at this app's components.", <><C>src/pages/rule-management</C> or <C>src/components</C></>],
            ["A definition of done", "The checklist at the end of DESIGN.md. Ask for the result of each line, not 'does it match?'.", "DESIGN.md, last section but one"],
          ]}
        />
        <Why
          items={[
            ["Why a markdown file and not this page?", "Because an agent reads text, in one pass, at the start of its work. DESIGN.md is short enough to read whole and structured so the values are data (YAML) and the judgement is prose."],
            ["Why include the reasons?", "A rule covers the case you thought of. A reason covers the case you did not. 'One primary button, so the eye has one place to land' lets it decide correctly on a page nobody has designed."],
            ["Why list the known gaps?", "Otherwise the agent finds 11.5px in the code, concludes it is allowed, and uses it everywhere. Telling it which values are drift stops the drift spreading."],
            ["AGENTS.md points at it.", "A four-line AGENTS.md in the Imperial Ops repo tells any agent that opens the project to read DESIGN.md first, so you do not have to remember to say it."],
          ]}
        />
      </Entry>

      <Entry title="Prompts that work" desc="Copy one, fill in the angle brackets. Each asks the agent to read first, names the rules most likely to be broken, lists the states, and asks for a report against the checklist.">
        <Code title={<><b>Build a new page</b> · in the Imperial Ops repo (plain CSS)</>} code={PROMPT_BUILD} />
        <Code title={<><b>Start a new project</b> · with React and Tailwind</>} code={PROMPT_SHADCN} />
        <Code title={<><b>Review work</b> · yours or another agent's</>} code={PROMPT_REVIEW} />
      </Entry>

      <Entry title="The contract itself" desc="The whole of DESIGN.md, exactly as an agent sees it. The top is machine-readable YAML; the rest is the judgement.">
        <div className="overflow-hidden rounded-2xl bg-l1 inset-ring inset-ring-line">
          <div className="flex h-8.5 items-center gap-2 border-b pr-1.5 pl-3.5 text-xs text-fg-3">
            <span className="flex-1"><b className="font-medium text-fg-2">DESIGN.md</b> · {design.split("\n").length} lines</span>
            <Button variant="ghost" size="xs" onClick={() => copy(design, "DESIGN.md copied")}>Copy all</Button>
          </div>
          <pre className="max-h-[520px] overflow-auto px-4 py-3.5 font-mono text-xs leading-[1.7] whitespace-pre-wrap text-fg-2">{design}</pre>
        </div>
      </Entry>

      <Entry title="How to check what comes back" desc="Do not ask 'does this match the design system?'. Everything will say yes. Ask questions that have a wrong answer.">
        <Spec
          mono={[1]}
          head={["Check", "How", "A pass looks like"]}
          rows={[
            ["No raw colours", "grep -rnE '#[0-9a-fA-F]{3,8}|rgba?\\(' src/pages/<page>", "Nothing outside token definitions"],
            ["On the scale", "grep -rnoE 'font-size: [^;]+|border-radius: [^;]+' src/pages/<page> | sort | uniq -c", "Only values from DESIGN.md"],
            ["In Tailwind: no arbitrary values", "grep -rnoE '(text|rounded|h)-\\[[^]]+\\]' src", "A short list you can explain line by line"],
            ["Both themes", "Toggle the theme", "Nothing unreadable, no white boxes in dark"],
            ["Keyboard only", "Unplug the mouse for a minute", "You can reach and trigger every action, and see where focus is"],
            ["Squint", "Blur your eyes at the screen", "Exactly one thing stands out, and it is the right thing"],
            ["Side by side", "Open the real page beside the new one", "You cannot tell which is the original"],
          ]}
        />
      </Entry>

      <Lesson title="Write for the reader who cannot ask you a question">
        <p>
          The useful way to think about an agent is as a very fast contractor who has never seen your product,
          will not ask what you meant, and will fill every gap with the most average thing it has seen.
          "Average" for a dashboard means blue buttons, drop shadows, 16px text and a chart library. Every rule
          in DESIGN.md that sounds obvious to you ("no colour except status") is there because the average is
          the opposite.
        </p>
        <p>
          So the skill is not prompt tricks. It is the same skill as writing a good brief for a person: say
          what it is for, show one finished example, name the mistakes you expect, and define done in a way
          that can fail. A design system is what makes that brief short, because most of it is already written.
        </p>
      </Lesson>
    </Section>
  )
}

const RETHEME = `/* Prove the system holds. This re-themes the whole page from seven lines.
   Delete the comment markers around one block at a time. */

/* 1. A blue-black ladder instead of neutral grey
.dark {
  --l0: #05070b; --l1: #0a0d13; --l2: #0e121a;
  --l3: #141924; --l4: #1a2030; --l5: #222a3d;
}
*/

/* 2. Tighter, squarer corners everywhere
:root {
  --radius-md: 4px; --radius-lg: 5px; --radius-xl: 6px;
  --radius-2xl: 8px; --radius-3xl: 10px;
}
*/

/* 3. A coloured accent: the 'one white thing' becomes amber
.dark { --primary: #e0a93e; --primary-hover: #c9952f; }
*/`

export function BuildYourOwn({ n }: { n: string }) {
  return (
    <Section
      id="build"
      n={n}
      title="Build your own"
      lede={
        <>
          The method that produced everything above, as eight steps you can repeat on any product. It took one
          working app and turned it into a contract, a theme and a component set. None of the steps needs
          taste; they need counting, naming and a willingness to delete.
        </>
      }
    >
      <Entry title="The method" desc="Do them in order. Each step's output is the next step's input.">
        <Spec
          mono={[]}
          head={["Step", "What you do", "What you end up with", "Here"]}
          rows={[
            ["1. Build first", "Make two or three real screens by eye. Do not design a system yet.", "Something to measure", "The six Imperial Ops pages"],
            ["2. Audit", "Count every colour, size, radius, gap and duration in the code. Sort by how often each appears.", "A frequency table", "Section 02's six commands"],
            ["3. Edit", "Merge near-duplicates. Keep what repeats, question what appears once. Write down what you could not merge.", "Scales, and a list of known gaps", "27 font sizes became 12"],
            ["4. Name the tokens", "Give each survivor a name that says what it is: --l3, --line-2, --fg-3.", "Tokens", "The top of index.css"],
            ["5. Make them classes", "Register each token in @theme so it becomes a class, and re-point the framework's scales at yours. Measure each text pair.", "A theme", "@theme in index.css"],
            ["6. Name the recipes", "Find class groups you type together three times. Make each one word.", "Materials and type styles", "surface-card, glass-bar, type-title"],
            ["7. Build the components", "List variants with 'use it when'. Write each as a base string plus a lookup table. Build only what a real screen needs.", "A component set", "src/components"],
            ["8. Write the contract", "Values as data, rules as prose with reasons, do's and don'ts, a checklist, the gaps. Then rebuild one screen to test it.", "DESIGN.md, and proof", "Section 18's Rules page"],
          ]}
        />
      </Entry>

      <Entry title="Try it: re-theme this page" desc="The real test of a system is whether it survives a change of mind. This box is a live stylesheet over the whole page. Uncomment a block and watch every component follow without one of them being edited.">
        <LiveCss title={<><b>A new look in seven lines</b> · uncomment a block</>} css={RETHEME} />
      </Entry>

      <Entry title="Do it from an empty folder" desc="Everything this app needs. There is no component library to install: the components are files you write, or copy from here.">
        <Code
          title={<><b>Terminal</b> · React, Tailwind v4 and the small libraries the product uses</>}
          code={`# 1. A React app with Vite.
npm create vite@latest my-design-system -- --template react-ts
cd my-design-system

# 2. Tailwind v4 (it is a Vite plugin now; there is no config file).
npm install tailwindcss @tailwindcss/vite
#    vite.config.ts:  plugins: [react(), tailwindcss()]

# 3. The fonts, and the libraries that supply behaviour but no styles.
npm install @fontsource-variable/geist @fontsource-variable/geist-mono lucide-react
npm install @base-ui/react cmdk sonner     # menus and dialogs, the palette, toasts

# 4. The theme: ONE file, src/index.css.
#    @import "tailwindcss";
#    .dark { --l3: #161616; ... }                tokens
#    @theme inline { --color-l3: var(--l3); }    tokens become classes
#    @utility surface-card { @apply ...; }       recipes

# 5. Components: one small file each in src/components, copying the shape of button.tsx.`}
        />
      </Entry>

      <Entry title="Check yourself" desc="Answer in your head first. If you can do all eight, you can build one of these.">
        <div className="rounded-2xl bg-l3 px-5 pb-2 inset-ring inset-ring-line [&>details:first-child]:border-t-0">
          <Quiz q="You need a panel that slides over the detail pane and stays until dismissed. Which material is it, and does it get a drop shadow?">
            It floats over the page, so it is one of the floating materials. You will work inside it for a
            while, so it is <b>solid</b> (the dialog recipe: page colour, a ring, the big shadow), not glass. Yes
            to the shadow: floating things are the only things that get one.
          </Quiz>
          <Quiz q="A stat card shows an error rate of 12%, which is bad. What changes colour?">
            <b>Only the number</b>, to red or orange depending on how bad. Not the card, not the label, not the
            border. If it needs more explanation, a small status pill goes in the foot line.
          </Quiz>
          <Quiz q="You are on a card (l3) and need a hover state for a row inside it. What background?">
            Not <b>l4</b>-by-habit: use <b>tint</b>, the white wash. Hover is "one rung up", and a transparent
            wash is one rung up from whatever it happens to be on. That is why it exists.
          </Quiz>
          <Quiz q="Why does Card use the recipe surface-card instead of writing bg-l3 and its ring classes itself?">
            So the decision "what a card is" lives in one place. The stat card, the table and the swatches on
            this page all use the same recipe; change it once and all of them move together.
          </Quiz>
          <Quiz q="An agent's page uses text-[13.5px] in four places. Is that a problem?">
            Yes. 13.5px is not on the scale; it is one of the app's own known gaps, and the agent has copied
            the drift. The fix is <b>text-sm</b> (13px), and the lesson is to keep "Known gaps" in the contract
            so drift is labelled as drift.
          </Quiz>
          <Quiz q="You want a new 'info' callout in blue. What does the system say?">
            That there is no blue, because blue would not be a status. An informational note is the{" "}
            <b>default grey callout</b>. If you find you really need a fifth meaning, that is a change to the
            system (add the token, its wash, its pill, write down what it means), not a one-off class.
          </Quiz>
          <Quiz q="A panel opens when you press a key. How long should its entrance animation be?">
            <b>Zero.</b> Keyboard-opened things appear instantly; you already know what is coming. The same
            panel opened with the mouse fades up over 220ms.
          </Quiz>
          <Quiz q="Your audit finds border-radius values of 8px (12 uses) and 9px (24 uses). What do you do?">
            Decide they are the same step drawn twice, pick the one used more (9px), name it (<b>lg</b>), and
            record 8px under known gaps so nobody adds a thirteenth. You do not add both to the scale: a scale
            with steps one pixel apart is not a scale.
          </Quiz>
        </div>
      </Entry>

      <Lesson title="A design system is finished when it is boring to use">
        <p>
          You will know it is working when building a new screen stops involving decisions about colour, size
          or spacing at all, and the only questions left are the interesting ones: what does this person need
          to know, and what do they need to do about it?
        </p>
        <p>
          Keep it alive the same way it was made. When you catch yourself typing a value by hand, stop and ask
          whether it is a new decision or an old one you did not name. Most of the time it is the second. Name
          it, add it to the contract, and it never has to be decided again.
        </p>
      </Lesson>
    </Section>
  )
}
