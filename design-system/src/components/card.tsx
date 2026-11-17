/* A card sits on the page: one rung up (l3), a hairline inset ring, a lit top edge.
 * No drop shadow. `lead` is the one important card on a page: stronger ring, rounder. */
import * as React from "react"

import { cn } from "@/lib/utils"

export function Card({ lead, className, ...props }: React.ComponentProps<"div"> & { lead?: boolean }) {
  return <div className={cn(lead ? "surface-lead p-4" : "surface-card px-4 py-3.5", className)} {...props} />
}

export function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("type-card-title", className)} {...props} />
}

/** A warning in the page, beside the thing it is about: a wash with a ring at 20%. */
export function Callout({
  tone = "note",
  icon,
  title,
  action,
  children,
  className,
}: {
  tone?: "danger" | "warning" | "note"
  icon?: React.ReactNode
  title: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === "note" ? "note" : "alert"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-3.5 py-[11px] text-sm inset-ring [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
        tone === "danger" && "bg-red-wash inset-ring-red/20 [&>svg]:text-red",
        tone === "warning" && "bg-orange-wash inset-ring-orange/22 [&>svg]:text-orange",
        tone === "note" && "bg-l3 inset-ring-line [&>svg]:text-fg-3",
        className
      )}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className={cn("font-semibold", tone === "danger" && "text-red-strong", tone === "warning" && "text-orange-strong")}>
          {title}
        </div>
        {children && <div className={tone === "danger" ? "text-red-text" : "text-fg-2"}>{children}</div>}
      </div>
      {action}
    </div>
  )
}

/** A rule's definition, or any code: darker than the page, mono, generous line height. */
export function CodeBlock({ className, ...props }: React.ComponentProps<"pre">) {
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-xl bg-l1 px-4 py-3.5 font-mono text-[12.5px] leading-[1.85] text-fg-3 inset-ring inset-ring-line [&_b]:font-normal [&_b]:text-code-val",
        className
      )}
      {...props}
    />
  )
}

/** Says what would be here and how to get it. Centred, in the label tone, no illustration. */
export function Empty({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col items-center gap-3 px-4 py-12 text-center text-fg-3 [&>svg]:size-5">
      {icon}
      <div className="max-w-sm">
        <div className="text-sm font-medium text-fg">{title}</div>
        {children && <div className="mt-1 text-sm leading-normal text-balance">{children}</div>}
      </div>
      {action}
    </div>
  )
}

/** Initials on a soft gradient. 28px. */
export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span className={cn("grid size-7 shrink-0 place-items-center rounded-full bg-(image:--avatar) text-[11px] font-semibold text-fg-2 inset-ring inset-ring-line-2", className)}>
      {initials}
    </span>
  )
}
