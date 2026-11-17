import * as React from "react"
import {
  ArrowDownWideNarrowIcon,
  ArrowUpRightIcon,
  BellOffIcon,
  CheckIcon,
  FilterIcon,
  HistoryIcon,
  InfoIcon,
  PanelLeftCloseIcon,
  PinIcon,
  SearchIcon,
  TriangleAlertIcon,
  BellIcon,
  CalendarClockIcon,
  HouseIcon,
  SirenIcon,
} from "lucide-react"

import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { Avatar, Callout, Card, CardTitle, CodeBlock, Empty } from "@/components/card"
import { SplitBar, WeeklyBars } from "@/components/charts"
import { CommandPaletteInline, PaletteGroup, PaletteItem } from "@/components/command-palette"
import { Field, Input, SearchBox, Textarea } from "@/components/field"
import { HoldButton } from "@/components/hold-button"
import { Kbd } from "@/components/kbd"
import { KeyHints, ListRow } from "@/components/list-row"
import { BrandMark, JumpButton, NavItem } from "@/components/nav"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@/components/overlays"
import { Fetching, Skeleton, useSheen } from "@/components/skeleton"
import { MetricWell, StatCard } from "@/components/stat"
import { StatusDot } from "@/components/status-dot"
import { Table } from "@/components/table"
import { Tabs } from "@/components/tabs"
import { notify } from "@/components/toast"
import { C, Code, Entry, Example, Lesson, Pair, Section, Spec, Why } from "@/showcase/lib/doc"
import { StateMatrix, previewState } from "@/showcase/lib/state-matrix"

/* ------------------------------------ Actions ------------------------------------ */

const VARIANTS = ["primary", "default", "ghost", "danger", "link"] as const
const LABEL: Record<(typeof VARIANTS)[number], string> = {
  primary: "Approve",
  default: "Deactivate",
  ghost: "Cancel",
  danger: "Reject",
  link: "View all 11",
}

const BUTTON_SOURCE = `// src/components/button.tsx, in full. Three strings joined together.
const BASE = "inline-flex items-center rounded-lg text-sm font-medium ... active:scale-[0.97]"

const VARIANT = {
  default: "bg-l4 text-fg inset-ring inset-ring-line-2 hover:bg-l5",
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  danger:  "bg-red-wash text-danger-fg inset-ring inset-ring-red/35 hover:bg-red/14",
  ghost:   "text-fg-2 hover:bg-l3 hover:text-fg",
}

const SIZE = {
  default: "h-8.5 gap-2 px-3.5",          // 34px
  sm:      "h-7 gap-1.5 rounded-md px-2.5", // 28px
}

export function Button({ variant = "default", size = "default", className, ...props }) {
  return <button className={cn(BASE, VARIANT[variant], SIZE[size], className)} {...props} />
}`

export function Actions({ n }: { n: string }) {
  return (
    <Section
      id="actions"
      n={n}
      title="Actions"
      lede={
        <>
          Things you press. The whole family shares one shape (34px tall, 9px corners, 13px medium text) and
          one behaviour (shrink to 97% when pressed). What changes between them is only how loudly they ask to
          be pressed.
        </>
      }
    >
      <Entry title="Button" desc="The typical case is the decision bar: a sentence, then one primary action and one alternative, each with its key.">
        <Example surface="busy" className="py-10">
          <div className="glass-bar flex w-full items-center gap-2 py-2.5 pr-2.5 pl-4.5">
            <span className="flex-1 text-sm font-medium text-fg-2">Every change needs a written reason</span>
            <Button variant="primary">Approve <Kbd>A</Kbd></Button>
            <Button variant="danger">Reject <Kbd>X</Kbd></Button>
          </div>
        </Example>
        <Spec
          head={["variant", "Looks like", "Use it when", ""]}
          rows={[
            ["default", "Raised grey with a ring", "Every ordinary button. A plain <Button> gives you this one.", <Button size="sm">Deactivate</Button>],
            ["primary", "White on near-black", "It is the one action this screen exists for. At most one per view.", <Button size="sm" variant="primary">Approve</Button>],
            ["ghost", "Nothing until hovered", "Cancel, and toolbar icons.", <Button size="sm" variant="ghost">Cancel</Button>],
            ["danger", "A red wash with a red ring", "Reject, delete. Never a solid red block.", <Button size="sm" variant="danger">Reject</Button>],
            ["link", "Quiet text that brightens", "Jumping to more of the same thing: 'View all 11'.", <Button variant="link">View all 11</Button>],
          ]}
        />
        <Example label="Every variant in every state, pinned so you can compare them without a mouse" className="p-4">
          <StateMatrix
            rows={VARIANTS}
            render={(variant, state) => (
              <Button variant={variant} {...previewState(state)}>
                {LABEL[variant]}
              </Button>
            )}
          />
        </Example>
        <Pair>
          <Example label="Sizes: 24, 28, 34, 38">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
          </Example>
          <Example label="With an icon, with a key, icon only">
            <Button><HistoryIcon /> Replay</Button>
            <Button>Open <ArrowUpRightIcon /></Button>
            <Button variant="primary">Approve <Kbd>A</Kbd></Button>
            <Button variant="ghost" size="icon" aria-label="Hide sidebar"><PanelLeftCloseIcon /></Button>
            <Button variant="ghost" size="icon" aria-label="Sort"><ArrowDownWideNarrowIcon /></Button>
          </Example>
        </Pair>
        <Example label="Edge case: a label too long for its space truncates, it never wraps">
          <Button className="max-w-56">
            <span className="truncate">Deactivate Stormtrooper armour fitting ticket duplicates</span>
          </Button>
        </Example>
        <Why
          items={[
            ["Why is the default the grey one?", "Because of rule 7: one white thing per screen. If a plain <Button> were white, every screen would fill with them. You have to ask for primary on purpose."],
            ["Why is pressed a scale and not a darker colour?", "It works identically on every variant, including the white one, and it reads as physical: the button gives under your finger."],
            ["Why is the edge an inset ring?", <>A real border would make grey buttons 2px larger than white ones. <C>inset-ring</C> draws inside, so every variant is exactly 34px.</>],
            ["The key cap lives in the button.", "On the right, and it recolours itself for the white and red variants. A shortcut nobody can see does not exist."],
          ]}
        />
        <Code title={<><b>button.tsx</b> · the whole pattern</>} code={BUTTON_SOURCE} />
      </Entry>

      <Entry title="Hold to confirm" desc="For the rare action that overrides a safety check. Press and hold for two seconds; let go early and it snaps back. Double-click the finished one to reset it.">
        <Example>
          <div className="flex w-full max-w-xl items-center gap-3 rounded-xl bg-orange-wash py-3 pr-3 pl-3.5 inset-ring inset-ring-orange/22">
            <span className="flex flex-1 flex-col text-sm">
              <strong className="font-semibold text-orange-strong">Confidence is below 60%</strong>
              <span className="text-fg-2">Approving this rule needs an override.</span>
            </span>
            <HoldButton />
          </div>
        </Example>
      </Entry>

      <Entry title="Badge, status pill, chip and key cap" desc="Three sizes of pill. The neutral badge (24px) carries a status dot and a word. Status pills (22px) use the 10 / 22 / 100 formula. The chip (20px) is the quietest label.">
        <Example>
          <Badge><StatusDot status="proposed" size="sm" />Proposed</Badge>
          <Badge><StatusDot status="active" size="sm" />Active</Badge>
          <Badge><StatusDot status="inactive" size="sm" />Inactive</Badge>
          <Badge variant="success"><CheckIcon />Validated</Badge>
          <Badge variant="pending">Proposed</Badge>
          <Badge variant="warning">Needs review</Badge>
          <Badge variant="danger">Escalated</Badge>
          <Badge variant="chip">Tune</Badge>
        </Example>
        <Example>
          <Kbd>J</Kbd> <Kbd>K</Kbd> <Kbd>/</Kbd> <Kbd>?</Kbd> <Kbd>Esc</Kbd> <Kbd>↵</Kbd> <Kbd>⌘K</Kbd> <Kbd>⌘↵</Kbd>
          <span className="ml-4 inline-flex items-center gap-1.5 text-xs text-fg-3"><Kbd>J</Kbd><Kbd>K</Kbd> Navigate</span>
        </Example>
      </Entry>

      <Lesson title="A component is a lookup table of class strings">
        <p>
          There is no library behind these. Open <C>button.tsx</C>: a <C>BASE</C> string every button gets, a{" "}
          <C>VARIANT</C> object with one string per kind, a <C>SIZE</C> object with one per size, and a
          function that joins three of them. That is the entire technique, and every component in{" "}
          <C>src/components</C> is built the same way.
        </p>
        <p>
          To make your own: write the table first (variant, looks like, use it when). If you cannot fill in
          "use it when", you do not need that variant. Then each row becomes one line in the object.
        </p>
        <p>
          One thing to know: the <C>className</C> prop is for <b>placing</b> a component (width, margin), not
          restyling it. Two Tailwind classes that set the same property do not reliably override each other,
          so if you want a different look, add a variant instead.
        </p>
      </Lesson>
    </Section>
  )
}

/* ------------------------------------ Inputs ------------------------------------ */

const MIN_REASON = 12

function ReasonField() {
  const [reason, setReason] = React.useState("")
  const [touched, setTouched] = React.useState(false)
  const length = reason.trim().length
  const short = touched && length < MIN_REASON
  return (
    <Field
      className="w-full max-w-xl"
      label="Why are you approving this rule?"
      htmlFor="reason"
      hint="It goes in the audit log with your name."
      error={short && `Add a little more detail (${MIN_REASON - length} more characters).`}
      aside={
        <span className={length >= MIN_REASON ? "text-green" : "text-fg-3 tabular-nums"}>
          {length >= MIN_REASON ? <CheckIcon className="size-3.5" strokeWidth={2.5} /> : `${length}/${MIN_REASON}`}
        </span>
      }
    >
      <Textarea
        id="reason"
        rows={2}
        placeholder="e.g. Matches the pre-charge pattern on every firing sequence"
        value={reason}
        aria-invalid={short || undefined}
        onChange={(e) => setReason(e.target.value)}
        onBlur={() => setTouched(true)}
      />
    </Field>
  )
}

export function Inputs({ n }: { n: string }) {
  return (
    <Section
      id="inputs"
      n={n}
      title="Inputs"
      lede={
        <>
          Two materials. A box you <em>type freely</em> into is a well: darker than the page, as if cut into
          it. A box you <em>search</em> with is card-coloured, like a control. Both are 34px, and both answer
          focus with a stronger hairline and a faint 3px glow rather than a coloured ring.
        </>
      }
    >
      <Entry title="A field, typically" desc="A label, the control, and one line under it that is either help or the error, never both. This is the product's real rule: every decision needs a reason of at least 12 characters. Type in it, then click away.">
        <Example>
          <ReasonField />
        </Example>
      </Entry>

      <Entry title="Search box and text input" desc="The search box has its icon and the key that focuses it built in. The text input is the one-line well.">
        <Example className="items-end">
          <SearchBox placeholder="Search rules, CIs, sources" className="w-80" />
          <Field label="Rule name" htmlFor="name" className="w-64">
            <Input id="name" defaultValue="Superlaser pre-charge warnings" />
          </Field>
        </Example>
      </Entry>

      <Entry title="States" desc="Pinned side by side. Hover does nothing on a field (it is not a button); focus and invalid are the two that matter.">
        <Example className="p-4">
          <StateMatrix
            rows={["input", "search", "textarea"] as const}
            states={["default", "focus", "disabled", "invalid"]}
            render={(row, state) => {
              const shared = {
                disabled: state === "disabled",
                "aria-invalid": state === "invalid" || undefined,
                ...(state === "focus" ? previewState(state) : {}),
              }
              return row === "input" ? (
                <Input placeholder="Rule name" {...shared} />
              ) : row === "search" ? (
                <SearchBox placeholder="Find a service" {...shared} />
              ) : (
                <Textarea rows={2} placeholder="Why?" {...shared} />
              )
            }}
          />
        </Example>
      </Entry>

      <Lesson title="Focus is part of the brand. Decide it once, for everything.">
        <p>
          Most interfaces leave the browser or framework default, a thick coloured ring, on everything.
          Imperial Ops has no accent colour, so a blue ring would be the loudest thing on screen. It has two
          treatments instead, split by what the thing is:
        </p>
        <ul>
          <li><b>Things you press</b> get a 2px outline, 2px away from the edge. One rule near the end of <C>index.css</C> covers every button, link and tab at once.</li>
          <li><b>Things you type in</b> get a stronger hairline (<C>line-3</C>) and a 3px glow at 5% white: <C>focus-visible:inset-ring-line-3 focus-visible:ring-[3px] focus-visible:ring-focus-glow</C>.</li>
        </ul>
        <p>
          Notice the search box uses <C>focus-within:</C> instead. The input inside it is invisible, so the{" "}
          <em>box</em> has to light up when its child has focus.
        </p>
        <p>
          Imperial Ops has no checkboxes, switches or selects yet, so neither does this system. When you need
          one, build it from these same pieces (a 4px-radius box with a <C>line-2</C> ring; checked is{" "}
          <C>bg-primary</C>) and add it to DESIGN.md.
        </p>
      </Lesson>
    </Section>
  )
}

/* ------------------------------------ Navigation ------------------------------------ */

const NAV = [["Home", HouseIcon], ["Incidents", SirenIcon], ["Alerts", BellIcon], ["Rules", FilterIcon], ["Hindcast", HistoryIcon], ["Change windows", CalendarClockIcon]] as const

export function Navigation({ n }: { n: string }) {
  const [status, setStatus] = React.useState("all")
  const [weeks, setWeeks] = React.useState("8")
  const [view, setView] = React.useState("brief")
  const [page, setPage] = React.useState("Rules")
  return (
    <Section
      id="navigation"
      n={n}
      title="Navigation"
      lede="Ways of moving between places and views. The chosen item is always the same idea: a raised chip, one rung up, with brighter text. Never an underline, never a colour."
    >
      <Entry
        title="Tabs: bare, and segmented"
        desc={
          <>
            Two looks for one component. <C>variant="bare"</C> is the plain row used to filter a list; a count
            sits beside each label. <C>variant="segmented"</C> puts the same tabs in a sunken track, for
            choosing a <em>mode</em> such as a time range. Click one, then use the arrow keys.
          </>
        }
      >
        <Pair>
          <Example label='variant="bare": filtering a list'>
            <Tabs
              label="Status"
              value={status}
              onChange={setStatus}
              items={[
                { value: "all", label: "All", count: 20 },
                { value: "proposed", label: "Proposed", count: 8 },
                { value: "active", label: "Active", count: 8 },
                { value: "inactive", label: "Inactive", count: 4 },
              ]}
            />
          </Example>
          <Example label='variant="segmented": choosing a mode'>
            <span className="text-xs text-fg-3">Completed weeks</span>
            <Tabs label="Completed weeks" variant="segmented" value={weeks} onChange={setWeeks} items={["4", "8", "12", "26"].map((w) => ({ value: w, label: w }))} />
            <Tabs
              label="Version"
              variant="segmented"
              value={view}
              onChange={setView}
              items={[{ value: "brief", label: "Brief" }, { value: "board", label: "Board" }, { value: "day", label: "Day" }, { value: "inbox", label: "Inbox", disabled: true }]}
            />
          </Example>
        </Pair>
      </Entry>

      <Entry title="Sidebar" desc="The heaviest material on screen (l0), so it recedes. Items are 32px; the current page is a raised chip. Click around.">
        <Example className="h-[400px] overflow-hidden p-0">
          <aside className="flex h-full w-60 flex-col gap-0.5 border-r bg-l0 px-2.5 pt-3.5 pb-3">
            <BrandMark>Imperial Ops</BrandMark>
            <JumpButton className="mb-2.5">Search or jump to…</JumpButton>
            {NAV.map(([label, Icon]) => (
              <NavItem key={label} href="#navigation" active={page === label} onClick={() => setPage(label)}>
                <Icon /> {label}
              </NavItem>
            ))}
            <div className="mt-auto flex items-center gap-2.5 border-t px-2 pt-3 text-sm">
              <Avatar initials="AP" />
              <span className="leading-tight">Admiral Piett<br /><span className="text-xs text-fg-3">Rule governor</span></span>
            </div>
          </aside>
          <div className="grid flex-1 place-items-center text-sm text-fg-3">{page}</div>
        </Example>
      </Entry>

      <Lesson title="One idea for 'you are here', used everywhere">
        <p>
          Look at the tab, the sidebar item, the selected list row and the segmented control. They are four
          components and <b>one decision</b>: the chosen thing is <C>bg-chip</C> with a hairline ring and{" "}
          <C>fg</C> text. In dark, <C>chip</C> is <C>l4</C>; in light it is white with a whisper of shadow.
        </p>
        <p>
          In the product that decision was typed out in five CSS files, and the light-theme version was a raw{" "}
          <C>#ffffff</C> in each. Naming it <C>--chip</C> turned five things to remember into one. When you
          build your own system, hunt for these: the same visual idea, re-implemented per component. They are
          the cheapest wins you will find.
        </p>
      </Lesson>
    </Section>
  )
}

/* ------------------------------------ Data display ------------------------------------ */

const RULE_ROWS = [
  { status: "proposed", name: "Superlaser pre-charge sequence warnings", id: "RUL-0435", meta: "Reactor Core", value: "47%", sub: "11 inc", warn: true },
  { status: "proposed", name: "Stormtrooper armour fitting ticket duplicates", id: "RUL-0428", meta: "Armory & Logistics", value: "95%", sub: "121 inc" },
  { status: "active", name: "Reactor coolant flow jitter at 40–60% output", id: "RUL-0366", meta: "Reactor Core", value: "89%", sub: "198 inc" },
  { status: "inactive", name: "MSE-6 mouse droid collision alerts", id: "RUL-0392", meta: "Facilities", value: "69%", sub: "58 inc" },
] as const

const INCIDENTS = [
  { id: "INC-40355", summary: "Superlaser focus lens pre-charge variance", resolution: "Duplicate", cleared: "14 min", opened: "20 Sept" },
  { id: "INC-40356", summary: "Pre-charge sequence alert, primary", resolution: "Duplicate", cleared: "9 min", opened: "8 Sept" },
  { id: "INC-40391", summary: "Tributary beam 4 phase drift during a very long pre-charge hold at reduced output", resolution: "Escalated", cleared: "1h 21m", opened: "2 Sept" },
]

export function DataDisplay({ n }: { n: string }) {
  const [selected, setSelected] = React.useState("RUL-0435")
  return (
    <Section
      id="data"
      n={n}
      title="Data display"
      lede="This is a product about numbers, so most of the system's care goes here. The pattern is always the same: a small quiet label, a big tight number, and colour only if the number is a problem."
    >
      <Entry title="Stat cards and the metric well" desc="A row of stat cards opens a detail page. When a number is a problem, only the number changes colour: the card stays grey.">
        <Example col>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <StatCard label="Confidence" value="47%" meter={0.47} tone="warn" foot={<Badge variant="warning" className="h-5 px-[7px] text-[11px]">Below 60%</Badge>} />
            <StatCard label="Purity" value="76%" meter={0.76} />
            <StatCard label="Incidents" value="11" foot="rolling 90 days" />
            <StatCard label="Escalated" value="0" foot="real incidents matched" />
          </div>
          <MetricWell className="max-w-md" items={[{ value: "1,118", label: "would hide" }, { value: "64%", label: "of tickets" }, { value: "3", label: "real incidents", bad: true }]} />
        </Example>
      </Entry>

      <Entry title="List rows" desc="The list pane's row: status dot, name over a mono ID and a meta line, and a right-aligned number. Click one. The key hints under a list are part of it.">
        <Example surface="l1" col className="max-w-[420px] gap-0 p-0">
          <div className="flex flex-col gap-px p-2">
            {RULE_ROWS.map((row) => (
              <ListRow key={row.id} {...row} selected={selected === row.id} onClick={() => setSelected(row.id)} />
            ))}
          </div>
          <KeyHints hints={[{ keys: ["J", "K"], label: "Navigate" }, { keys: ["/"], label: "Search" }, { keys: ["⌘K"], label: "Commands" }]} />
        </Example>
      </Entry>

      <Entry title="Card, lead card and code block" desc="A card is a rung up from the page with a hairline ring and a lit top edge. The lead card is the one important card on a page: stronger ring, rounder corners.">
        <Example className="items-start">
          <Card lead className="flex w-80 flex-col gap-3">
            <CardTitle>Approve this rule</CardTitle>
            <p className="text-sm leading-normal text-fg-2">It would hide 11 incidents a quarter from Reactor Core. None of them were worked by an engineer.</p>
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1">Approve <Kbd>A</Kbd></Button>
              <Button variant="danger" className="flex-1">Reject <Kbd>X</Kbd></Button>
            </div>
            <span className="text-xs text-fg-3">Every change needs a written reason</span>
          </Card>
          <Card className="w-64">
            <div className="text-sm font-medium">What is a hindcast?</div>
            <p className="mt-1.5 text-sm leading-[1.55] text-fg-2">A replay. It takes the tickets people already cancelled by hand and runs them through the logic that is live today.</p>
          </Card>
          <CodeBlock className="min-w-80 flex-1">
            where <b>ci</b> matches <b>superlaser-tributary-*</b>{"\n"}
            {"  "}and <b>sequence</b> = <b>pre-charge</b>{"\n"}
            {"  "}and <b>assignment_group</b> = <b>Reactor Core</b> // scope, locked
          </CodeBlock>
        </Example>
      </Entry>

      <Entry title="Table" desc="Quiet header, hairline rows, numbers right-aligned in tabular figures. You describe the columns; the component draws the card, the header and the rows.">
        <Example className="p-4">
          <Table
            caption="Related incidents"
            rows={INCIDENTS}
            rowKey={(row) => row.id}
            columns={[
              { head: "Incident", cell: (r) => r.id, className: "font-mono text-xs text-fg-3" },
              { head: "Summary", cell: (r) => <span className="block max-w-80 truncate text-fg">{r.summary}</span> },
              { head: "Resolution", cell: (r) => (r.resolution === "Escalated" ? <Badge variant="danger">Escalated</Badge> : r.resolution) },
              { head: "Cleared in", cell: (r) => r.cleared, align: "right" },
              { head: "Opened", cell: (r) => r.opened, align: "right" },
            ]}
          />
        </Example>
      </Entry>

      <Entry title="Charts" desc="No chart library, as in the product: bars are divs, sized with flex and percentages, drawn with the same tokens as everything else.">
        <Pair>
          <Example col label="Weekly bars: the past is quiet, this week is the text colour">
            <div className="flex items-baseline justify-between">
              <span className="type-section">Matched incidents per week</span>
              <span className="text-xs text-fg-3">11 total</span>
            </div>
            <WeeklyBars values={[1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]} from="13 Jul" />
          </Example>
          <Example col label="Split bar: the numbers are written under it, so there is no legend to decode">
            <SplitBar parts={[{ label: "Caught by a rule", value: 1074, tone: "green" }, { label: "Caught by a change window", value: 286, tone: "tone-2" }, { label: "Not caught", value: 689, tone: "tone-3" }]} />
          </Example>
        </Pair>
        <Why
          items={[
            ["One grey ramp, one status colour.", "Brightest for what matters most. A series may take a status colour only when it means that status: green here is literally 'caught'."],
            ["An honest limit.", <>Run through a colour-blindness checker, green against the mid grey scores 7.5, which is only acceptable <em>with</em> a second cue, and the darkest grey is under 3:1 against the surface. So these charts must always carry direct labels and 2px gaps, and offer a table.</>],
            ["Three series, in a fixed order.", "The ramp has room for an order (caught, partly caught, missed), not for six unrelated categories. If you need more, split into small charts."],
            ["Text never wears the series colour.", "Labels and values stay in fg, fg-2 and fg-3. The coloured square beside them carries identity."],
          ]}
        />
      </Entry>

      <Lesson title="Numbers: make the label quiet and the value loud, then stop">
        <p>
          The stat card is three decisions: the label is 12px medium in <C>fg-3</C>, the value is 26px semibold
          with tight tracking, and the meter is 4px tall in the text colour. Nothing else. No icon, no coloured
          background, no trend arrow unless the trend is the point.
        </p>
        <p>
          When you design a data component, write the sentence a person should be able to say after one glance
          ("confidence is 47%, and that is a problem"). Every element either helps them say that sentence or is
          removed. That is where the orange number comes from: it is the only way "and that is a problem" gets
          onto the card.
        </p>
      </Lesson>
    </Section>
  )
}

/* ------------------------------------ Feedback ------------------------------------ */

export function Feedback({ n }: { n: string }) {
  return (
    <Section
      id="feedback"
      n={n}
      title="Feedback"
      lede="How the interface tells you something happened or went wrong. The order of loudness is fixed: a toast confirms, a callout warns, and only danger is red."
    >
      <Entry title="Callout" desc="A wash with a ring at 20%, sitting in the page beside the thing it is about. Red when a rule would have hidden a real incident, orange for a caution, grey for a note.">
        <Example col className="max-w-3xl">
          <Callout tone="danger" icon={<TriangleAlertIcon />} title="3 real incidents matched this rule" action={<Button variant="danger" size="xs">Review</Button>}>
            If it had been active, engineers would not have been paged for them.
          </Callout>
          <Callout tone="warning" icon={<TriangleAlertIcon />} title="Confidence is below 60%">
            The sample is small. Approving it needs an override.
          </Callout>
          <Callout icon={<InfoIcon />} title="What is a hindcast?">
            A replay of the past against today's rules. It is evidence, not a prediction.
          </Callout>
        </Example>
      </Entry>

      <Entry title="Toast" desc="The confirmation after a decision: glass, bottom right, gone on its own. It says what happened in the past tense and what state things are in now.">
        <Example>
          <Button onClick={() => notify({ title: "RUL-0435 approved", description: "Reason recorded in the audit log" })}>Approve a rule</Button>
          <Button onClick={() => notify({ tone: "failed", title: "Could not save your decision", description: "The correlation engine did not answer. Try again." })}>Fail to save</Button>
          <Button onClick={() => notify({ tone: "plain", title: "Class copied", description: "bg-l3" })}>A plain note</Button>
        </Example>
      </Entry>

      <Entry title="Waiting" desc="What is already known shows at once. Everything still being fetched is a soft shape cut to the size of what will land, and one band of light crosses them all together. Old rows about to be replaced, as during a search, stay put with data-sheen-stale, sit back to 55% and take the same light. Press the button to wait again.">
        <Waiting />
      </Entry>

      <Entry title="Empty" desc="Says what would be here and how to get it. Centred, in the label tone, with no illustration.">
        <Pair>
          <Example>
            <Empty icon={<PinIcon />} title="No pinned groups" action={<Button size="sm">Choose a group</Button>}>
              Pin a group from the filter beside "Rules" to keep it here.
            </Empty>
          </Example>
          <Example>
            <Empty icon={<BellOffIcon />} title="Nothing reached a person this hour">
              412 alerts were hidden by rules and 231 joined open incidents.
            </Empty>
          </Example>
        </Pair>
      </Entry>

      <Lesson title="Write the states before you draw the component">
        <p>
          A component is not finished when the happy case looks good. Before building one, list its states:{" "}
          <b>empty, waiting, partial, full, too much, wrong</b>. Most "it looks broken" bugs are a state nobody
          drew: the list with no rows, the name that is 90 characters long, the number that failed to load.
        </p>
        <p>
          When you hand a component to an agent, the list of states is the most useful thing you can add to
          the prompt, because it is exactly what a model will skip if you do not ask.
        </p>
      </Lesson>
    </Section>
  )
}

/* A list row already known, beside a pane still fetching its detail: one band crosses both. */
function Waiting() {
  const root = React.useRef<HTMLDivElement>(null)
  const [waiting, setWaiting] = React.useState(true)
  useSheen(root)
  React.useEffect(() => {
    if (!waiting) return
    const done = window.setTimeout(() => setWaiting(false), 3600)
    return () => window.clearTimeout(done)
  }, [waiting])
  return (
    <Example col>
      <div ref={root} className="grid gap-3 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <div className="surface-card flex flex-col gap-1 self-start px-3.5 py-3">
          <div className="text-base font-medium text-fg">Pre-charge variance</div>
          <div className="type-id">RUL-0435</div>
        </div>
        {waiting ? (
          <div className="surface-card flex flex-col gap-2.5 px-4 py-3.5">
            <Fetching>Fetching the evidence for RUL-0435…</Fetching>
            <Skeleton shape="pill" className="h-[22px] w-24" />
            <Skeleton className="h-3.5 w-[92%]" />
            <Skeleton className="h-3.5 w-[56%]" />
            <Skeleton shape="card" className="mt-1 h-16" />
          </div>
        ) : (
          <div className="surface-card flex flex-col gap-2.5 px-4 py-3.5">
            <Badge variant="warning" className="self-start">Below 60%</Badge>
            <p className="text-base text-fg-2">Pre-charge warnings appear on every firing sequence, and 3 real incidents matched.</p>
            <MetricWell items={[{ value: "1,118", label: "would hide" }, { value: "64%", label: "of tickets" }, { value: "3", label: "real incidents", bad: true }]} />
          </div>
        )}
      </div>
      <Button size="sm" className="self-start" onClick={() => setWaiting(true)} disabled={waiting}>
        Wait again
      </Button>
    </Example>
  )
}

/* ------------------------------------ Overlays ------------------------------------ */

export function Overlays({ n }: { n: string }) {
  const [sort, setSort] = React.useState("confidence")
  return (
    <Section
      id="overlays"
      n={n}
      title="Overlays"
      lede={
        <>
          Things that appear above the page. Small ones that belong to a control (menus, popovers) are glass.
          Big ones you work inside (dialogs) are solid, over a plain dim. Positioning, focus and the Esc key
          come from Base UI, an unstyled library the product already uses; every class is ours. Each demo is a
          real trigger: open it.
        </>
      }
    >
      <Entry title="Menu, popover and tooltip" desc="Glass, 10px corners, 4px of padding, items 30px tall. The highlighted item is a white wash, the chosen one is ticked. They scale in from the button that opened them. The tooltip is solid, because it often sits on chart marks.">
        <Example>
          <Menu>
            <MenuTrigger render={<Button variant="ghost" size="icon" aria-label="Sort" />}>
              <ArrowDownWideNarrowIcon />
            </MenuTrigger>
            <MenuContent>
              <MenuLabel>Sort by</MenuLabel>
              <MenuRadioGroup value={sort} onValueChange={setSort}>
                <MenuRadioItem value="confidence">Confidence</MenuRadioItem>
                <MenuRadioItem value="newest">Newest</MenuRadioItem>
                <MenuRadioItem value="incidents">Incidents matched</MenuRadioItem>
              </MenuRadioGroup>
              <MenuSeparator />
              <MenuItem>Pin this group <Kbd className="ml-auto">P</Kbd></MenuItem>
              <MenuItem danger>Deactivate rule</MenuItem>
            </MenuContent>
          </Menu>
          <span className="mr-6 text-xs text-fg-3">The sort menu</span>

          <Popover>
            <PopoverTrigger render={<Button />}>
              <FilterIcon /> All groups
            </PopoverTrigger>
            <PopoverContent>
              <div className="font-medium">Filter by group</div>
              <div className="mt-0.5 mb-3 text-xs text-fg-2">Rules scoped to one assignment group.</div>
              <div className="flex flex-wrap gap-1.5">
                {["Reactor Core", "Facilities", "HoloNet Comms", "Life Support"].map((g) => <Badge key={g} variant="chip">{g}</Badge>)}
              </div>
            </PopoverContent>
          </Popover>

          <Tooltip label={<>Replay against today's rules <Kbd>R</Kbd></>}>
            <Button variant="ghost" size="icon" aria-label="Replay"><HistoryIcon /></Button>
          </Tooltip>
          <span className="text-xs text-fg-3">Hover the icon</span>
        </Example>
      </Entry>

      <Entry title="Dialog" desc="Solid, 14px corners, the biggest shadow. The page behind is dimmed, never blurred: blur belongs to the thing floating, not to what is behind it.">
        <Example>
          <Dialog>
            <DialogTrigger render={<Button />}>Open an incident</DialogTrigger>
            <DialogContent title="INC-40355 · Superlaser focus lens pre-charge variance" description="Closed as a duplicate after 14 minutes. Nobody worked it.">
              <MetricWell items={[{ value: "14 min", label: "to clear" }, { value: "0", label: "people paged" }, { value: "Duplicate", label: "resolution" }]} />
              <div className="flex justify-end gap-2">
                <DialogClose render={<Button variant="ghost" />}>Close <Kbd>Esc</Kbd></DialogClose>
                <Button>Open in Incidents</Button>
              </div>
            </DialogContent>
          </Dialog>
        </Example>
      </Entry>

      <Entry title="Command palette" desc={<>The thinnest glass with the heaviest blur, and no animation at all. It is shown inline here; press <Kbd>⌘K</Kbd> anywhere on this page for the real one.</>}>
        <Example surface="busy" className="justify-center py-10">
          <CommandPaletteInline>
            <PaletteGroup heading="Go to">
              <PaletteItem meta={<><Kbd>G</Kbd><Kbd>R</Kbd></>}><SearchIcon /> Rules</PaletteItem>
              <PaletteItem meta={<><Kbd>G</Kbd><Kbd>H</Kbd></>}><HistoryIcon /> Hindcast</PaletteItem>
            </PaletteGroup>
            <PaletteGroup heading="RUL-0435">
              <PaletteItem meta={<Kbd>A</Kbd>}><CheckIcon /> Approve</PaletteItem>
              <PaletteItem meta="Reactor Core"><PinIcon /> Pin its group</PaletteItem>
            </PaletteGroup>
          </CommandPaletteInline>
        </Example>
      </Entry>

      <Why
        items={[
          ["Glass or solid?", "Ask how long you stay in it. A menu is a glance, so it can be translucent and let the page show through. A dialog is a place you read and decide in, so it needs a calm, solid surface."],
          ["Why use a library here at all?", "Because the hard part of a menu is not how it looks. It is staying on screen near an edge, trapping focus, arrow keys, type-ahead, Esc and screen readers. Base UI does that with no styles of its own, so the look stays entirely yours."],
          ["Why no blur behind a dialog?", "Blurring the whole page is expensive to draw and it destroys the context you opened the dialog to act on. A dim keeps the page readable behind it."],
          ["Esc steps back one layer.", "The popup first, then the panel under it. Never straight to the page."],
        ]}
      />
    </Section>
  )
}
