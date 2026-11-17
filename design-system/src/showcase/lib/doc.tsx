/* The page's own furniture: sections, example stages, code boxes and lesson notes.
 * None of this is part of the design system. It is built from it. */
import * as React from "react"
import { CheckIcon, CopyIcon, GraduationCapIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { notify } from "@/components/toast"

export function copy(text: string, what = "Copied") {
  navigator.clipboard?.writeText(text)
  notify({ tone: "plain", title: what, description: text.length > 64 ? text.slice(0, 64) + "…" : text })
}

export function Section({
  id,
  n,
  title,
  lede,
  children,
}: {
  id: string
  n: string
  title: string
  lede: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section id={id} data-section className="mt-18 scroll-mt-6 border-t pt-10">
      <div className="font-mono text-xs text-fg-3">{n}</div>
      <h2 className="mt-1.5 mb-2 text-2xl leading-tight font-semibold tracking-[-0.025em]">
        {title}
      </h2>
      <p className="max-w-[72ch] text-[15px] leading-[1.6] text-pretty text-fg-2">{lede}</p>
      {children}
    </section>
  )
}

export function Entry({
  title,
  desc,
  children,
}: {
  title: string
  desc?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mt-10">
      <h3 className="type-card-title mb-1">{title}</h3>
      {desc && <p className="mb-3.5 max-w-[76ch] text-base leading-[1.55] text-fg-2">{desc}</p>}
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

/** The stage a demo stands on. `label` names what is shown; it never sits inside the component. */
export function Example({
  label,
  children,
  className,
  col,
  surface = "l2",
  ...props
}: React.ComponentProps<"div"> & {
  label?: React.ReactNode
  col?: boolean
  surface?: "l0" | "l1" | "l2" | "l3" | "busy"
}) {
  return (
    <div className="min-w-0">
      {label && <div className="mb-1.5 font-mono text-xs text-fg-3">{label}</div>}
      <div
        className={cn(
          "relative flex min-w-0 gap-3 rounded-3xl p-6 inset-ring inset-ring-line",
          col ? "flex-col items-stretch" : "flex-wrap items-center",
          surface === "l0" && "bg-l0",
          surface === "l1" && "bg-l1",
          surface === "l2" && "bg-l2",
          surface === "l3" && "bg-l3",
          // Something colourful to float glass over, so the blur has work to do.
          surface === "busy" &&
            "bg-[linear-gradient(100deg,var(--green),var(--amber)_45%,var(--red))]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

export function Pair({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid items-start gap-3.5 *:min-w-0 xl:grid-cols-2", className)}>{children}</div>
  )
}

/** A code box with a copy button. What you see is exactly what gets copied. */
export function Code({
  title,
  code,
  wrap,
  className,
}: {
  title: React.ReactNode
  code: string
  /** Wrap long lines instead of scrolling sideways: for class lists and markup. */
  wrap?: boolean
  className?: string
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-l1 inset-ring inset-ring-line", className)}>
      <div className="flex h-8.5 items-center gap-1 border-b pr-1.5 pl-3.5 text-xs text-fg-3">
        <span className="flex-1 truncate [&_b]:font-medium [&_b]:text-fg-2">{title}</span>
        <button
          className="flex h-6 items-center gap-1.5 rounded-sm px-2 text-xs font-medium text-fg-2 transition-colors duration-150 hover:bg-l4 hover:text-fg"
          onClick={() => copy(code.trim())}
        >
          <CopyIcon className="size-3" /> Copy
        </button>
      </div>
      <pre
        className={cn(
          "max-h-[460px] overflow-auto px-4 py-3.5 font-mono text-xs leading-[1.75] text-fg-2 [tab-size:2]",
          wrap && "[overflow-wrap:anywhere] whitespace-pre-wrap"
        )}
      >
        {code.trim()}
      </pre>
    </div>
  )
}

/** The teaching note: what the idea is, and how you would do it yourself. */
export function Lesson({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className="mt-6 grid gap-x-5 gap-y-2 rounded-2xl bg-l1 p-5 inset-ring inset-ring-line md:grid-cols-[150px_minmax(0,1fr)]">
      <div className="flex items-center gap-2 self-start font-mono text-xs text-fg-3 md:pt-0.5">
        <GraduationCapIcon className="size-3.5" /> Lesson
      </div>
      <div className="min-w-0">
        <h4 className="type-section mb-1.5">{title}</h4>
        <div className="flex max-w-[78ch] flex-col gap-2 text-base leading-[1.6] text-fg-2 [&_b]:font-medium [&_b]:text-fg [&_li]:ml-4 [&_ol]:list-decimal [&_strong]:font-medium [&_strong]:text-fg [&_ul]:list-disc">
          {children}
        </div>
      </div>
    </aside>
  )
}

/** Short "why is it like this" notes, two to a row. */
export function Why({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <ul className="mt-3.5 grid gap-x-10 lg:grid-cols-2">
      {items.map(([head, body]) => (
        <li key={head} className="border-t py-2.5 text-sm leading-[1.55] text-fg-2">
          <b className="font-medium text-fg">{head}</b> {body}
        </li>
      ))}
    </ul>
  )
}

/** A plain reference table: the hc-table recipe from the product. */
export function Spec({ head, rows, mono = [0] }: { head: string[]; rows: React.ReactNode[][]; mono?: number[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-l3 px-1 pt-1 pb-0.5 inset-ring inset-ring-line">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-normal whitespace-nowrap text-fg-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "px-3 py-2 align-top text-fg-2",
                    j === 0 && "text-fg",
                    mono.includes(j) && "font-mono text-xs leading-[1.6] whitespace-nowrap"
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A rule from DESIGN.md, rendered as the right way beside the wrong way. */
export function DoDont({
  rule,
  doThis,
  dont,
  why,
}: {
  rule: string
  doThis: React.ReactNode
  dont: React.ReactNode
  why: React.ReactNode
}) {
  return (
    <div className="mt-8">
      <h3 className="type-card-title">{rule}</h3>
      <p className="mt-1 mb-3 max-w-[76ch] text-base leading-[1.55] text-fg-2">{why}</p>
      <div className="grid gap-3.5 md:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-green">
            <CheckIcon className="size-3.5" /> Do
          </div>
          <div className="flex min-h-32 flex-wrap items-center gap-3 rounded-3xl bg-l2 p-6 inset-ring inset-ring-line">
            {doThis}
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-fg">
            <XIcon className="size-3.5" /> Don't
          </div>
          <div className="flex min-h-32 flex-wrap items-center gap-3 rounded-3xl bg-l2 p-6 inset-ring inset-ring-red/20">
            {dont}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Follows one value from the component down to the hex: the chain a design system is made of. */
export function Trace({ steps }: { steps: { layer: string; code: string; note: string }[] }) {
  return (
    <ol className="grid gap-px overflow-hidden rounded-2xl bg-line inset-ring inset-ring-line md:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
      {steps.map((step, i) => (
        <li key={step.layer} className="flex flex-col gap-1.5 bg-l3 p-4">
          <span className="font-mono text-[11px] text-fg-3">
            {String(i + 1).padStart(2, "0")} · {step.layer}
          </span>
          <code className="font-mono text-xs break-all text-fg">{step.code}</code>
          <span className="text-xs leading-normal text-fg-2">{step.note}</span>
        </li>
      ))}
    </ol>
  )
}

/** Inline code. */
export function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-xs bg-tint-2 px-[5px] py-px font-mono text-xs text-fg">
      {children}
    </code>
  )
}

/** A question with the answer tucked away, for checking you understood. */
export function Quiz({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group border-t py-3 text-sm">
      <summary className="flex cursor-pointer list-none items-start gap-3 font-medium text-fg [&::-webkit-details-marker]:hidden">
        <span className="mt-px font-mono text-[11px] text-fg-3 group-open:text-green">Q</span>
        <span className="flex-1">{q}</span>
        <span className="text-xs font-normal text-fg-3 group-open:hidden">Show answer</span>
      </summary>
      <div className="mt-2 ml-6 max-w-[74ch] leading-[1.6] text-fg-2 [&_b]:font-medium [&_b]:text-fg">
        {children}
      </div>
    </details>
  )
}
