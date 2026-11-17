import * as React from "react"
import { TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { Card, CardTitle } from "@/components/card"
import { Kbd } from "@/components/kbd"
import { Textarea } from "@/components/field"
import { notify } from "@/components/toast"
import { HoldButton } from "@/components/hold-button"
import { KeyHints, ListRow } from "@/components/list-row"
import { MetricWell, StatCard } from "@/components/stat"
import { StatusDot, type Status } from "@/components/status-dot"
import { DoDont, Entry, Lesson, Section, Spec, Why } from "@/showcase/lib/doc"

const RULES: { id: string; name: string; meta: string; status: Status; conf: number; inc: number }[] = [
  { id: "RUL-0435", name: "Superlaser pre-charge sequence warnings", meta: "Reactor Core", status: "proposed", conf: 47, inc: 11 },
  { id: "RUL-0428", name: "Stormtrooper armour fitting ticket duplicates", meta: "Armory & Logistics", status: "proposed", conf: 95, inc: 121 },
  { id: "RUL-0424", name: "Deck 12 CO2 warnings during shift change", meta: "Life Support", status: "proposed", conf: 84, inc: 97 },
  { id: "RUL-0366", name: "Reactor coolant flow jitter at 40–60% output", meta: "Reactor Core", status: "active", conf: 89, inc: 198 },
]
const MIN_REASON = 12

/** The product's decision flow, working: list, detail, a glass form, a written reason, an override, a toast. */
function DecisionDemo() {
  const [index, setIndex] = React.useState(0)
  const [open, setOpen] = React.useState<false | "pointer" | "key">(false)
  const [reason, setReason] = React.useState("")
  const [overridden, setOverridden] = React.useState(false)
  const [decided, setDecided] = React.useState<Record<string, boolean>>({})
  const field = React.useRef<HTMLTextAreaElement>(null)
  const rule = RULES[index]
  const low = rule.conf < 60
  const ready = reason.trim().length >= MIN_REASON && (!low || overridden)
  const canDecide = rule.status === "proposed" && !decided[rule.id]

  const close = () => { setOpen(false); setReason(""); setOverridden(false) }
  const move = (by: number) => { setIndex((i) => Math.min(RULES.length - 1, Math.max(0, i + by))); close() }
  const start = (how: "pointer" | "key") => { if (canDecide) { setOpen(how); requestAnimationFrame(() => field.current?.focus()) } }
  const submit = () => {
    if (!ready) return
    setDecided((d) => ({ ...d, [rule.id]: true }))
    notify({ title: `${rule.id} approved`, description: "Reason recorded in the audit log" })
    close()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    // The same order the product uses: an open decision owns the keyboard, then fields, then the page.
    if (open) {
      if (e.key === "Escape") { e.preventDefault(); close() }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() }
      return
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const run = ({ j: () => move(1), ArrowDown: () => move(1), k: () => move(-1), ArrowUp: () => move(-1), a: () => start("key") } as Record<string, () => void>)[e.key]
    if (run) { e.preventDefault(); run() }
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="grid h-[520px] overflow-hidden rounded-3xl outline-none inset-ring inset-ring-line focus-visible:inset-ring-line-3 md:grid-cols-[340px_minmax(0,1fr)]"
    >
      <div className="flex min-h-0 flex-col border-r bg-l1">
        <div className="px-4 pt-4 pb-2 type-chapter">Rules</div>
        <div className="scroll-fade flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-2 pt-0.5 pb-3">
          {RULES.map((r, i) => (
            <ListRow
              key={r.id}
              tabIndex={-1}
              status={decided[r.id] ? "active" : r.status}
              name={r.name}
              id={r.id}
              meta={r.meta}
              value={`${r.conf}%`}
              sub={`${r.inc} inc`}
              warn={r.conf < 60}
              selected={i === index}
              onClick={() => { setIndex(i); close() }}
            />
          ))}
        </div>
        <KeyHints hints={[{ keys: ["J", "K"], label: "Navigate" }, { keys: ["A"], label: "Approve" }]} />
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6 pb-40">
          <div className="flex items-center gap-2.5">
            <span className="type-id">{rule.id}</span>
            <Badge>
              <StatusDot status={decided[rule.id] ? "active" : rule.status} size="sm" />
              {decided[rule.id] || rule.status === "active" ? "Active" : "Proposed"}
            </Badge>
          </div>
          <h4 className="type-chapter">{rule.name}</h4>
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard label="Confidence" value={`${rule.conf}%`} meter={rule.conf / 100} tone={low ? "warn" : "default"} />
            <StatCard label="Incidents" value={rule.inc} foot="rolling 90 days" />
          </div>
          <p className="type-body">
            Click in this frame, then use <Kbd>J</Kbd> <Kbd>K</Kbd> to move and <Kbd>A</Kbd> to approve. The first
            rule is below 60% confidence, so it also asks for an override.
          </p>
        </div>

        {!open && canDecide && (
          <div className="glass-bar absolute inset-x-5 bottom-5 flex items-center gap-2 py-2.5 pr-2.5 pl-4.5">
            <span className="flex-1 text-sm font-medium text-fg-2">Every change needs a written reason</span>
            <Button variant="primary" onClick={() => start("pointer")}>Approve <Kbd>A</Kbd></Button>
          </div>
        )}

        {open && (
          <div
            className={cn(
              "glass-bar absolute inset-x-5 bottom-5 flex flex-col gap-3 p-4",
              // Pointer-opened: materialise in. Keyboard-opened: appear instantly.
              open === "pointer" &&
                "transition-[opacity,translate,scale,filter] duration-[220ms] ease-out starting:translate-y-2 starting:scale-[0.99] starting:opacity-0 starting:blur-xs"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="type-card-title">Approve this rule</div>
                <div className="text-sm text-fg-2">It will start hiding matching alerts straight away.</div>
              </div>
              <MetricWell items={[{ value: rule.inc, label: "would hide" }, { value: `${rule.conf}%`, label: "confidence", bad: low }]} />
            </div>
            <Textarea ref={field} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this safe to hide?" />
            {low && (
              <div className="flex items-center gap-3 rounded-xl bg-orange-wash py-2.5 pr-2.5 pl-3.5 inset-ring inset-ring-orange/22">
                <TriangleAlertIcon className="size-4 shrink-0 text-orange" />
                <span className="flex flex-1 flex-col text-sm">
                  <strong className="font-semibold text-orange-strong">Confidence is below 60%</strong>
                  <span className="text-fg-2">Hold to confirm you have read the evidence.</span>
                </span>
                <HoldButton onConfirm={() => setOverridden(true)} />
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className={cn("flex items-center text-xs tabular-nums", reason.trim().length >= MIN_REASON ? "text-green" : "text-fg-3")}>
                {reason.trim().length >= MIN_REASON ? "Reason given" : `${reason.trim().length}/${MIN_REASON}`}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={close}>Cancel <Kbd>Esc</Kbd></Button>
                <Button variant="primary" disabled={!ready} onClick={submit}>Approve <Kbd>⌘↵</Kbd></Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function Patterns({ n }: { n: string }) {
  return (
    <Section
      id="patterns"
      n={n}
      title="Patterns"
      lede={
        <>
          The top layer: how the pieces behave together. This is the "UX" half of the system, and the half
          that is hardest to see in a screenshot, so it is the half most worth writing down.
        </>
      }
    >
      <Entry
        title="The decision flow, working"
        desc="Everything the product believes about making a change, in one frame: the list drives the detail, the action floats over the evidence instead of leaving it, every change needs a reason, a risky one needs a hold, and the answer is a toast."
      >
        <DecisionDemo />
        <Why
          items={[
            ["The form floats; it never navigates.", "You are deciding because of the evidence on the page. Taking you to another screen to type the reason would hide the thing you are reasoning about."],
            ["Friction is proportional to risk.", "A normal approval is one key and a sentence. A low-confidence one adds a two-second hold. Nothing is ever a modal 'Are you sure?'."],
            ["The button says why it is disabled.", "The counter (7/12) and the override row are the explanation. A greyed-out button with no reason beside it is a dead end."],
            ["Opened by key: instant. Opened by mouse: animated.", "Press A and the form is simply there. Click Approve and it fades up, because your eye needs to find it."],
          ]}
        />
      </Entry>

      <Entry title="Keyboard first" desc="Every primary action has one key, and the key is printed on the control. One listener per page decides who gets each key press, in a fixed order.">
        <Spec
          mono={[0]}
          head={["Key", "Does", "Where"]}
          rows={[
            [<><Kbd>J</Kbd> <Kbd>K</Kbd></>, "Next and previous item in the list", "Every list page"],
            [<Kbd>/</Kbd>, "Focus search", "Every list page"],
            [<Kbd>⌘K</Kbd>, "Command palette", "Everywhere"],
            [<><Kbd>A</Kbd> <Kbd>X</Kbd> <Kbd>E</Kbd> <Kbd>D</Kbd></>, "Approve, reject, activate, deactivate", "Rules"],
            [<><Kbd>1</Kbd> – <Kbd>5</Kbd></>, "Jump to a chapter", "Hindcast"],
            [<><Kbd>[</Kbd> <Kbd>]</Kbd></>, "Tuck away the sidebar, the list", "Everywhere"],
            [<Kbd>?</Kbd>, "Start the guided tour", "Everywhere"],
            [<Kbd>Esc</Kbd>, "Step back one layer", "Everywhere"],
            [<Kbd>⌘↵</Kbd>, "Submit the open decision", "While a decision is open"],
          ]}
        />
        <Spec
          mono={[]}
          head={["Order", "Who gets the key", "Why"]}
          rows={[
            ["1", "The guided tour, if it is showing", "It has taken over the screen."],
            ["2", "⌘K, always", "The palette must be reachable from anywhere."],
            ["3", "The open palette", "It handles its own typing and arrows."],
            ["4", "An open decision: only Esc and ⌘↵", "So typing a reason containing 'a' or 'x' cannot approve or reject."],
            ["5", "A focused field: keys are text", "Esc, ↵ and ↓ leave the field."],
            ["6", "Anything held with ⌘, Ctrl or Alt", "Left for the browser."],
            ["7", "The page's own key map", "j, k, /, a, x…"],
          ]}
        />
      </Entry>

      <Entry title="Structure every page shares" desc="Six pages, one skeleton. Learn it once and every page is familiar.">
        <Spec
          mono={[]}
          head={["Pattern", "The rule", "How it is built"]}
          rows={[
            ["List drives detail", "Choosing something on the left shows it on the right. Nothing opens a new page.", "Selection is state in the page; the detail pane renders whatever is selected."],
            ["The address is the state", "Every selection is a link: #/rules/RUL-0428. Back works, and you can paste it to someone.", "A 30-line hash router. Pages only ever see the parts after the page name."],
            ["The decision stays in reach", "Narrow: a glass bar floats over the pane. Wide: it docks into a sticky rail on the right.", "A container query on the detail pane, not a media query on the window."],
            ["Colour means look here", "A page at rest is grey. Anything coloured is something a person should look at.", "Status tokens only. See section 03."],
            ["Numbers come with a sentence", "A figure is followed by what it is a figure of: '11' then 'rolling 90 days'.", "The stat card's foot line; the lead paragraph on reports."],
            ["Tours teach in place", "? starts a tour that spotlights the real controls, not a slideshow about them.", "The tour skill: a veil, a spotlight that glides, a glass card."],
          ]}
        />
      </Entry>

      <Entry title="Voice" desc="The words are part of the interface. Plain sentences that say what happened and what it means.">
        <Spec
          mono={[]}
          head={["Instead of", "Write", "Because"]}
          rows={[
            ["Alerts: 56 / 699 (8.0%)", <>
              <b className="font-semibold text-fg">56 alerts</b> reached a person in the last hour, out of 699.
            </>, "A sentence says what the number means. The figures that matter are fg at 600 inside fg-2 text."],
            ["Submit", "Approve", "Buttons are verbs that name the outcome."],
            ["Confidence Score", "Confidence", "Sentence case. Labels are short nouns."],
            ["Error: validation failed", "Add a little more detail (5 more characters).", "Say what to do, beside the field it is about."],
            ["No data", "Nothing reached a person this hour.", "An empty state is still information."],
            ["Sep 28, 2026 · 0.47", "28 Sept · 47%", "British dates, human units, separators in big numbers: 14,568."],
          ]}
        />
      </Entry>

      <Lesson title="Patterns are the part an agent cannot infer from a screenshot">
        <p>
          Give a model a picture of the Rules page and it will reproduce the greys, the type and the cards
          surprisingly well. It will not know that <Kbd>A</Kbd> approves, that the form must not navigate, that
          a keyboard-opened panel should not animate, or that amber means "waiting" and not "warning". None of
          that is visible.
        </p>
        <p>
          So when you document your own system, spend the most words where the pixels say the least:{" "}
          <b>behaviour, order, and the reasons behind rules</b>. A reason is what lets someone (or something)
          make the right call in a case you never wrote down. "One primary button" is a rule; "so the eye has
          exactly one place to land" is what makes it apply to a page you have not designed yet.
        </p>
      </Lesson>
    </Section>
  )
}

export function DoAndDont({ n }: { n: string }) {
  return (
    <Section
      id="dodont"
      n={n}
      title="Do and don't"
      lede="The rules that are easiest to break, drawn both ways. Each 'don't' is something a default component library or an unbriefed agent will do without being asked."
    >
      <DoDont
        rule="One primary action per view"
        why="The white button is the one high-contrast thing on screen. Two of them and the eye has nowhere to land; the second action is the everyday grey or the red wash."
        doThis={<><Button variant="primary">Approve <Kbd>A</Kbd></Button><Button variant="danger">Reject <Kbd>X</Kbd></Button><Button variant="ghost">Cancel</Button></>}
        dont={<><Button variant="primary">Approve</Button><Button variant="primary">Reject</Button><Button variant="primary">Cancel</Button></>}
      />
      <DoDont
        rule="Colour only for status, on the smallest thing"
        why="When a number is a problem, the number changes colour. The card does not, and neither does the heading. Colour that decorates stops being able to warn."
        doThis={<StatCard className="w-56" label="Confidence" value="47%" meter={0.47} tone="warn" foot={<Badge variant="warning" className="h-5 px-[7px] text-[11px]">Below 60%</Badge>} />}
        dont={
          <div className="w-56 rounded-2xl bg-orange px-4 py-3.5 text-hold-fg">
            <div className="text-xs font-medium uppercase tracking-widest">⚠ Confidence</div>
            <div className="type-stat mt-1">47%</div>
            <div className="mt-2 text-xs font-bold">LOW CONFIDENCE!</div>
          </div>
        }
      />
      <DoDont
        rule="Emphasis is weight, not brightness or colour"
        why="Nothing is brighter than fg, and there is no bold. In a sentence the important words are fg at 500 or 600 inside fg-2 text."
        doThis={<p className="type-lead max-w-sm">Rules hid <b className="font-semibold text-fg">412</b> and <b className="font-semibold text-fg">231</b> joined incidents that were already open.</p>}
        dont={<p className="max-w-sm text-[17px] leading-[1.62] text-fg-2">Rules hid <b className="font-bold text-white underline">412</b> and <b className="font-bold text-[#6cb6ff]">231</b> joined incidents that were already open.</p>}
      />
      <DoDont
        rule="Edges, not shadows, for things on the page"
        why="A card sits on the page: one rung up, a hairline ring, a lit top edge. Drop shadows are reserved for things that float, which is what makes floating things read as floating."
        doThis={
          <Card className="w-64"><CardTitle>Evidence</CardTitle><div className="mt-2 text-sm text-fg-2">Pre-charge warnings appear on every firing sequence.</div></Card>
        }
        dont={
          <div className="w-64 rounded-2xl border border-white/25 bg-l5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <div className="type-card-title">Evidence</div>
            <div className="mt-2 text-sm text-fg-2">Pre-charge warnings appear on every firing sequence.</div>
          </div>
        }
      />
      <DoDont
        rule="Danger is a wash, never a solid block"
        why="A solid red button is the loudest thing a screen can contain, and rejecting a rule is routine work. The wash says 'this is the destructive one' without shouting it."
        doThis={<><Button variant="danger">Reject <Kbd>X</Kbd></Button><Badge variant="danger">Escalated</Badge></>}
        dont={<><button className="h-8.5 rounded-lg bg-red px-3.5 text-sm font-bold text-white">REJECT</button><span className="rounded-xs bg-red px-2 py-0.5 text-xs font-bold text-white uppercase">Escalated</span></>}
      />
      <DoDont
        rule="Stay on the scale"
        why="Every radius, height and font size comes from the lists in sections 04 to 06. A value that is nearly on the scale is worse than one that is far off, because nobody notices it until there are thirty of them."
        doThis={<><Button>Deactivate</Button><Badge>Proposed</Badge><Kbd>D</Kbd></>}
        dont={<><button className="h-[37px] rounded-[5px] bg-l4 px-[13px] text-[13.5px] font-medium inset-ring inset-ring-line-2">Deactivate</button><span className="inline-flex h-[23px] items-center rounded-[11px] bg-l3 px-[9px] text-[12.5px] font-medium inset-ring inset-ring-line">Proposed</span></>}
      />
    </Section>
  )
}
