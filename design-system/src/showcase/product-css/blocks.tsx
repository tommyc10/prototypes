/* What a product CSS lesson is drawn with: a stage of plain HTML, the live stylesheet that
 * styles it, the markup to copy, and the copy cards. The lessons themselves are in data.ts. */
import * as React from "react"

import { cn } from "@/lib/utils"
import { Code, Entry, Pair, Spec } from "@/showcase/lib/doc"
import { CopyRows } from "@/showcase/lib/copy-rows"
import { LiveCss } from "@/showcase/lib/live-css"
import { RECIPES, TYPE_SCALE, type Lesson, type Part, type Recipe } from "./data"
import "./product.css"

/** The lessons' sentences carry their own <code> and <strong>, so they arrive as HTML. */
export function Prose({ html, className }: { html: string; className?: string }) {
  return (
    <span
      className={cn(
        "[&_code]:rounded-xs [&_code]:bg-tint-2 [&_code]:px-[5px] [&_code]:py-px [&_code]:font-mono [&_code]:text-xs [&_code]:text-fg [&_strong]:font-medium [&_strong]:text-fg",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/* The icons the demos point at with <use href="#i-search" />. */
const ICONS = `
  <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></symbol>
  <symbol id="i-alert" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></symbol>
  <symbol id="i-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></symbol>
  <symbol id="i-side" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></symbol>`

export function Icons() {
  return <svg width="0" height="0" className="absolute" aria-hidden="true" dangerouslySetInnerHTML={{ __html: `<defs>${ICONS}</defs>` }} />
}

/** The demos are plain HTML with no React behind them, so the few that respond to a click are
 * wired up here, once, for everything inside `root`. */
export function useDemoBehaviour(root: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const el = root.current
    if (!el) return
    let holdTimer = 0

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element
      // The shell demo: tuck the sidebar or the list away.
      const toggle = target.closest<HTMLElement>("[data-toggle]")
      if (toggle) el.querySelector("#shell")?.toggleAttribute(toggle.dataset.toggle!)
      // Tabs: the one you click becomes the active one.
      const tab = target.closest(".mn-tab")
      if (tab) for (const t of tab.parentElement!.querySelectorAll(".mn-tab")) t.toggleAttribute("data-active", t === tab)
      if (target.closest("#ease-play")) el.querySelector("#ease-stage")?.toggleAttribute("data-play")
      // A new element, so @starting-style runs again.
      const entering = target.closest("#enter-play") && el.querySelector(".demo-enter")
      if (entering) entering.replaceWith(entering.cloneNode(true))
    }

    // Hold to confirm: two seconds held, or it snaps back.
    const hold = () => el.querySelector<HTMLElement>("#hold")
    const label = (text: string) => (hold()!.querySelector(".mn-hold-label")!.textContent = text)
    const letGo = () => {
      clearTimeout(holdTimer)
      delete hold()?.dataset.holding
    }
    const onDown = (e: PointerEvent) => {
      const button = hold()
      if (!button?.contains(e.target as Node)) return
      if ("done" in button.dataset) {
        delete button.dataset.done
        return label("Hold to override")
      }
      button.dataset.holding = ""
      holdTimer = window.setTimeout(() => {
        letGo()
        button.dataset.done = ""
        label("Override confirmed")
      }, 2000)
    }
    const onOut = (e: PointerEvent) => {
      const button = hold()
      if (button?.contains(e.target as Node) && !button.contains(e.relatedTarget as Node)) letGo()
    }

    el.addEventListener("click", onClick)
    el.addEventListener("pointerdown", onDown)
    el.addEventListener("pointerout", onOut)
    window.addEventListener("pointerup", letGo)
    return () => {
      letGo()
      el.removeEventListener("click", onClick)
      el.removeEventListener("pointerdown", onDown)
      el.removeEventListener("pointerout", onOut)
      window.removeEventListener("pointerup", letGo)
    }
  }, [root])
}

type Demo = Extract<Part, { k: "demo" }>

/* Memoised so React never writes the HTML a second time and undoes what a click changed. */
const Stage = React.memo(function Stage({ demo }: { demo: Demo }) {
  return (
    <div
      id={demo.id}
      // .mn is the product's root element; the lessons' CSS expects to be inside it.
      className={cn(
        "product-stage mn relative min-w-0 rounded-3xl inset-ring inset-ring-line",
        demo.surface === "l1" ? "bg-l1" : "bg-l2",
        demo.flush ? "overflow-hidden" : "flex gap-3 p-6",
        !demo.flush && (demo.col ? "flex-col items-stretch" : "flex-wrap items-center")
      )}
      dangerouslySetInnerHTML={{ __html: demo.html }}
    />
  )
})

const three = (item: { css: string; tailwind: string; theme: string }): [string, string[]][] => [
  ["CSS", [item.css]],
  ["Tailwind", [item.tailwind]],
  // The theme's class is only worth a line when it is shorter than writing the values out.
  ...(item.theme === item.tailwind ? [] : ([["Theme", [item.theme]]] as [string, string[]][])),
]

export function RecipeGrid({ items }: { items: Recipe[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2.5">
      {items.map((item) => (
        <div key={item.name} className="surface-card overflow-hidden">
          {item.preview && (
            <div
              className={cn(
                "grid min-h-16 place-items-center overflow-hidden border-b p-3.5",
                item.glass ? "bg-[linear-gradient(100deg,var(--green),var(--amber)_45%,var(--red))]" : "bg-l2"
              )}
              dangerouslySetInnerHTML={{ __html: item.preview }}
            />
          )}
          <div className="px-3 pt-2.5 pb-2 leading-[1.35]">
            <b className="block text-sm font-medium">{item.name}</b>
            <span className="block text-xs text-fg-3">{item.use}</span>
          </div>
          <CopyRows rows={three(item)} />
        </div>
      ))}
    </div>
  )
}

function TypeScale() {
  return (
    <div className="rounded-2xl bg-l3 px-4 inset-ring inset-ring-line">
      {TYPE_SCALE.map((item, i) => (
        <div key={item.name} className={cn("grid items-center gap-x-6 gap-y-2 py-3.5 lg:grid-cols-[minmax(0,1fr)_420px]", i > 0 && "border-t")}>
          <div className="min-w-0 *:max-w-none! *:truncate" dangerouslySetInnerHTML={{ __html: item.sample }} />
          <div className="min-w-0 text-xs text-fg-3">
            <b className="text-sm font-medium text-fg">{item.name}</b> {item.source}
            <CopyRows className="mt-1.5 px-0! pb-0!" rows={three(item)} />
          </div>
        </div>
      ))}
    </div>
  )
}

const NOTE = "max-w-[76ch] text-base leading-[1.55] text-fg-2"

function PartView({ part }: { part: Part }) {
  switch (part.k) {
    case "p":
    case "note":
      return <p className={NOTE}><Prose html={part.html} /></p>
    case "demo":
      return (
        <Pair>
          <div className="flex flex-col gap-2.5">
            <Stage demo={part} />
            {part.markup && <Code title={<b>Markup</b>} code={part.markup} />}
          </div>
          <LiveCss title={<><b>{part.label ?? "CSS"}</b> · click to edit</>} css={part.css} />
        </Pair>
      )
    case "why":
      return (
        <ul className="grid gap-x-10 lg:grid-cols-2">
          {part.items.map((item) => (
            <li key={item} className="border-t py-2.5 text-sm leading-[1.55] text-fg-2"><Prose html={item} /></li>
          ))}
        </ul>
      )
    case "recipes":
      return <RecipeGrid items={RECIPES[part.key]} />
    case "label":
      return <div className="mt-3.5 text-xs font-medium text-fg-3">{part.text}</div>
    case "type":
      return <TypeScale />
    case "lookup":
      return <Spec mono={[]} head={part.head} rows={part.rows.map((row) => row.map((cell) => <Prose html={cell} />))} />
  }
}

/** A lesson's entries. `lead` puts the lesson's opening sentences above its first demo, for
 * lessons that share a section with others and so have no heading of their own. */
export function Entries({ lesson, lead }: { lesson: Lesson; lead?: boolean }) {
  return lesson.entries.map((entry, i) => {
    const [first, ...rest] = entry.parts
    const intro = first.k === "p" ? first.html : ""
    const desc = [lead && i === 0 && lesson.lede, intro].filter(Boolean).join(" ")
    return (
      <Entry key={entry.title} title={entry.title} desc={desc ? <Prose html={desc} /> : undefined}>
        {(intro ? rest : entry.parts).map((part, j) => (
          <PartView key={j} part={part} />
        ))}
      </Entry>
    )
  })
}
