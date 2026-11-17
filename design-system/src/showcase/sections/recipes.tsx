import * as React from "react"
import {
  ArrowDownWideNarrowIcon,
  BellIcon,
  CalendarClockIcon,
  ChevronDownIcon,
  FilterIcon,
  HistoryIcon,
  HouseIcon,
  ListIcon,
  PanelLeftCloseIcon,
  SearchIcon,
  ShieldCheckIcon,
  SirenIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { SearchBox } from "@/components/field"
import { Kbd } from "@/components/kbd"
import { Tabs } from "@/components/tabs"
import { SplitBar, WeeklyBars } from "@/components/charts"
import { KeyHints, ListRow } from "@/components/list-row"
import { StatCard } from "@/components/stat"
import { StatusDot } from "@/components/status-dot"
import { C, Code, Entry, Lesson, Section } from "@/showcase/lib/doc"

const NAV = [
  ["Home", HouseIcon],
  ["Incidents", SirenIcon],
  ["Alerts", BellIcon],
  ["Rules", FilterIcon],
  ["Hindcast", HistoryIcon],
  ["Change windows", CalendarClockIcon],
] as const

const ROWS = [
  { status: "proposed", name: "Superlaser pre-charge sequence warnings", id: "RUL-0435", meta: "Reactor Core", value: "47%", sub: "11 inc", warn: true },
  { status: "proposed", name: "Stormtrooper armour fitting ticket duplicates", id: "RUL-0428", meta: "Armory & Logistics", value: "95%", sub: "121 inc" },
  { status: "proposed", name: "Hyperdrive fault codes on impounded YT freighters", id: "RUL-0433", meta: "Hyperdrive Maintenance", value: "38%", sub: "15 inc", warn: true },
  { status: "proposed", name: "Deck 12 CO2 warnings during shift change", id: "RUL-0424", meta: "Life Support", value: "84%", sub: "97 inc" },
  { status: "active", name: "Reactor coolant flow jitter at 40–60% output", id: "RUL-0366", meta: "Reactor Core", value: "89%", sub: "198 inc" },
  { status: "active", name: "TIE ion engine pre-flight timeout during cold start", id: "RUL-0376", meta: "TIE Hangar Ops", value: "85%", sub: "289 inc" },
  { status: "inactive", name: "MSE-6 mouse droid collision alerts", id: "RUL-0392", meta: "Facilities", value: "69%", sub: "58 inc" },
] as const

/** The Rules page, rebuilt from nothing but the tokens and components on this page. */
function RulesScreen() {
  const [status, setStatus] = React.useState("all")
  return (
    <div className="@container/screen overflow-hidden rounded-3xl inset-ring inset-ring-line">
      <div className="grid h-[720px] grid-cols-[minmax(0,1fr)] @min-[900px]/screen:grid-cols-[220px_340px_minmax(0,1fr)]">
        {/* sidebar: l0, the heaviest material */}
        <aside className="hidden min-h-0 flex-col gap-0.5 border-r bg-l0 px-2.5 pt-3.5 pb-3 @min-[900px]/screen:flex">
          <div className="flex items-center gap-2.5 px-2 pt-1 pb-3.5 font-semibold tracking-[-0.01em]">
            <span className="grid size-[22px] place-items-center rounded-sm bg-primary text-primary-fg">
              <svg viewBox="0 0 24 24" className="size-3.5"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>
            </span>
            Imperial Ops
          </div>
          <div className="mb-2.5 flex h-8 items-center gap-2 rounded-lg bg-l3 pr-1.5 pl-2.5 text-sm text-fg-3 inset-ring inset-ring-line">
            <SearchIcon className="size-3.5" /> <span className="flex-1">Search or jump to…</span> <Kbd>⌘K</Kbd>
          </div>
          {NAV.map(([label, Icon]) => (
            <div
              key={label}
              className={cn(
                "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-base text-fg-2",
                label === "Rules" && "bg-chip font-medium text-fg shadow-chip"
              )}
            >
              <Icon className={cn("size-4", label === "Rules" ? "text-fg" : "text-fg-3")} /> {label}
            </div>
          ))}
          <div className="mt-auto flex items-center gap-2.5 border-t px-2 pt-3 text-sm">
            <span className="grid size-7 place-items-center rounded-full bg-(image:--avatar) text-[11px] font-semibold text-fg-2 inset-ring inset-ring-line-2">AP</span>
            <span className="leading-tight">Admiral Piett<br /><span className="text-xs text-fg-3">Rule governor</span></span>
          </div>
        </aside>

        {/* list: l1, one step lighter */}
        <div className="hidden min-h-0 flex-col border-r bg-l1 @min-[900px]/screen:flex">
          <div className="flex flex-col gap-3 px-4 pt-4.5 pb-3">
            <div className="flex items-center gap-1.5">
              <h4 className="type-chapter">Rules</h4>
              <Button variant="ghost" size="sm" className="font-normal text-fg-3">All groups <ChevronDownIcon /></Button>
            </div>
            <SearchBox placeholder="Search rules, CIs, sources" />
            <div className="flex items-center justify-between">
              <Tabs
                label="Status"
                value={status}
                onChange={setStatus}
                items={[{ value: "all", label: "All", count: 20 }, { value: "proposed", label: "Proposed", count: 8 }, { value: "active", label: "Active", count: 8 }]}
              />
              <Button variant="ghost" size="icon" aria-label="Sort"><ArrowDownWideNarrowIcon /></Button>
            </div>
          </div>
          <div className="scroll-fade flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-2 pt-0.5 pb-3">
            {ROWS.map((row, i) => <ListRow key={row.id} {...row} selected={i === 0} />)}
          </div>
          <KeyHints hints={[{ keys: ["J", "K"], label: "Navigate" }, { keys: ["/"], label: "Search" }, { keys: ["⌘K"], label: "Commands" }]} />
        </div>

        {/* detail: l2, the page. Floating things anchor to this pane. */}
        <div className="relative flex min-h-0 min-w-0 flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-7 pb-40 *:shrink-0 @min-[900px]/screen:px-10">
            <div className="flex items-center gap-2.5">
              <span className="-ml-1.5 flex gap-0.5 border-r pr-2">
                <Button variant="ghost" size="icon" aria-label="Hide sidebar"><PanelLeftCloseIcon /></Button>
                <Button variant="ghost" size="icon" aria-label="Hide list"><ListIcon /></Button>
              </span>
              <span className="type-id">RUL-0435</span>
              <Badge><StatusDot status="proposed" size="sm" />Proposed</Badge>
            </div>
            <h3 className="type-title mt-3 mb-2">Superlaser pre-charge sequence warnings</h3>
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-fg-2">
              <ShieldCheckIcon className="size-3.5 text-fg-3" /> Scoped to <strong className="font-medium text-fg">Reactor Core</strong>
              <span className="text-fg-3">· Death Star</span>
              <span className="mx-1.5 h-3 w-px bg-line-2" /> Correlation engine · 2.9
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5 @min-[640px]/screen:grid-cols-4">
              <StatCard label="Confidence" value="47%" meter={0.47} tone="warn" foot={<Badge variant="warning" className="h-5 px-[7px] text-[11px]">Below 60%</Badge>} />
              <StatCard label="Purity" value="76%" meter={0.76} />
              <StatCard label="Incidents" value="11" foot="rolling 90 days" />
              <StatCard label="Escalated" value="0" foot="real incidents matched" />
            </div>

            <h4 className="type-section mt-8 mb-3">Evidence</h4>
            <p className="type-body mb-3.5 max-w-[68ch]">
              Pre-charge warnings appear on every firing sequence. The sample is small and a quarter of the
              incidents were worked by engineers.
            </p>
            <pre className="overflow-x-auto rounded-xl bg-l1 px-4 py-3.5 font-mono text-[12.5px] leading-[1.85] text-fg-3 inset-ring inset-ring-line">
              where <span className="text-code-val">ci</span> matches <span className="text-code-val">superlaser-tributary-*</span>{"\n"}
              {"  "}and <span className="text-code-val">sequence</span> = <span className="text-code-val">pre-charge</span>{"\n"}
              {"  "}and <span className="text-code-val">assignment_group</span> = <span className="text-code-val">Reactor Core</span> // scope, locked
            </pre>

            <div className="mt-8 mb-3 flex items-baseline justify-between">
              <h4 className="type-section">Matched incidents per week</h4>
              <span className="text-xs text-fg-3">11 total</span>
            </div>
            <WeeklyBars values={[1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]} from="13 Jul" />
          </div>

          <div className="glass-bar absolute inset-x-6 bottom-6 flex items-center gap-2 py-2.5 pr-2.5 pl-4.5">
            <span className="flex-1 truncate text-sm font-medium text-fg-2">Every change needs a written reason</span>
            <Button variant="primary">Approve <Kbd>A</Kbd></Button>
            <Button variant="danger">Reject <Kbd>X</Kbd></Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Recipes({ n }: { n: string }) {
  return (
    <Section
      id="recipes"
      n={n}
      title="Recipes and a screen"
      lede={
        <>
          The acceptance test for a design system is whether you can rebuild the product with it and nothing
          else. Below is the Rules page and two signature pieces from Home and Hindcast, made only from the
          tokens and components above. No raw colours, no one-off sizes.
        </>
      }
    >
      <Entry
        title="The Rules page"
        desc={
          <>
            Compare it with the real one at <C>localhost:5188/#/rules</C>. It is a live layout: the detail pane
            scrolls, the bar floats, and below 900px of its own width it drops to a single column by container
            query.
          </>
        }
      >
        <RulesScreen />
      </Entry>

      <Entry title="The brief" desc="Home's opening paragraph: a whole dashboard written as one sentence. The numbers that matter are fg at 600; the two that need a person take a status colour. This is 'emphasis by weight' and 'colour means look here' at full size.">
        <div className="rounded-3xl bg-l2 p-8 inset-ring inset-ring-line">
          <div className="mb-3 text-sm text-fg-3">Good afternoon, Admiral.</div>
          <p className="max-w-[1000px] text-[clamp(22px,2.3vw,30px)] leading-[1.28] font-medium tracking-[-0.03em] text-balance text-fg-3">
            <b className="font-semibold text-fg">56 alerts</b> reached a person in the last hour, out of 699. Rules hid{" "}
            <b className="font-semibold text-fg">412</b> and <b className="font-semibold text-fg">231</b> joined incidents that
            were already open. <b className="font-semibold text-orange">1 change window</b> is past its planned end; the
            other 4 in place are on time. <b className="font-semibold text-fg">8 rules</b> are waiting for your decision,
            and <b className="font-semibold text-red">6 of them</b> would have hidden a real page this hour.
          </p>
        </div>
      </Entry>

      <Entry title="The verdict" desc="Hindcast's opening: one hero figure, a lead paragraph that explains it, then the same number broken into its parts. Green is allowed here because the figure literally is 'caught'.">
        <div className="@container/verdict rounded-3xl bg-l2 p-8 inset-ring inset-ring-line">
          <div className="grid items-center gap-x-12 gap-y-6 @min-[760px]/verdict:grid-cols-[auto_minmax(0,1fr)]">
            <div>
              <div className="type-hero text-green">
                66<span className="ml-[3px] text-[0.46em] font-medium tracking-[-0.02em] text-fg-3">%</span>
              </div>
              <div className="mt-4 max-w-48 text-sm leading-snug text-fg-2">of the tickets cancelled by hand would have been caught</div>
            </div>
            <p className="type-lead">
              Over the last <b className="font-semibold text-fg">8 completed weeks</b>, operators cancelled{" "}
              <b className="font-semibold text-fg">2,049</b> of 14,568 tickets by hand. Replayed against the suppression
              logic that is live today, <b className="font-semibold text-fg">1,360</b> of them would never have reached a
              person: <b className="font-semibold text-fg">1,074</b> caught by an active rule and{" "}
              <b className="font-semibold text-fg">286</b> by a change window.
            </p>
          </div>
          <SplitBar
            className="mt-8"
            parts={[
              { label: "Caught by a rule", value: 1074, tone: "green" },
              { label: "Caught by a change window", value: 286, tone: "tone-2" },
              { label: "Not caught", value: 689, tone: "tone-3" },
            ]}
          />
        </div>
      </Entry>

      <Code
        className="mt-10"
        title={<><b>The whole shell</b> · what the Rules page is underneath</>}
        code={`<div className="grid h-svh grid-cols-[240px_380px_minmax(0,1fr)] overflow-hidden">
  <aside className="flex min-h-0 flex-col border-r bg-l0"> … nav … </aside>

  <div className="flex min-h-0 flex-col border-r bg-l1">
    <header> title · search · tabs </header>
    <div className="scroll-fade min-h-0 flex-1 overflow-y-auto"> <ListRow /> … </div>
    <KeyHints />
  </div>

  <main className="relative flex min-h-0 min-w-0 flex-col">
    <div className="min-h-0 flex-1 overflow-y-auto px-10 pt-7 pb-40"> … evidence … </div>
    <div className="glass-bar absolute inset-x-6 bottom-6"> sentence · <Button variant="primary">Approve</Button> </div>
  </main>
</div>`}
      />

      <Lesson title="Rebuilding a real screen is how you find out what is missing">
        <p>
          Making this screen is how the component list was decided. Everything in <C>src/components</C> is
          there because this page, or one of the other five, needed it; nothing is there "in case". That is
          the difference between a product's system and a general library: a library gives you the alphabet,
          a system gives you this product's own words.
        </p>
        <p>
          It also showed what was <em>not</em> needed. No new colour, no new radius, no new font size. When a
          rebuild goes through without touching the foundations, the foundations are done. When you find
          yourself adding <C>text-[13.5px]</C> to make something look right, either the scale is missing a step
          or (much more often) you have found a place the original drifted.
        </p>
      </Lesson>
    </Section>
  )
}
