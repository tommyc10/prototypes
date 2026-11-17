/* Fields. Two materials:
 *   a box you type freely into is a WELL: darker than the page, as if cut into it
 *   a box you search or pick with is CARD-coloured, like a control
 * Both are 34px, and both answer focus the same way: a stronger hairline (line-3) and a
 * faint 3px glow, never a coloured ring. Invalid is a red ring at 60%. */
import * as React from "react"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Kbd } from "./kbd"

const FOCUS = "transition-shadow duration-150 focus-visible:inset-ring-line-3 focus-visible:ring-[3px] focus-visible:ring-focus-glow"
const WELL = "w-full bg-well text-base text-fg outline-none inset-ring inset-ring-line-2 placeholder:text-fg-3 disabled:opacity-40 aria-invalid:inset-ring-red/60"

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(WELL, FOCUS, "h-8.5 rounded-lg px-3", className)} {...props} />
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(WELL, FOCUS, "resize-none rounded-xl px-3 py-2.5 leading-normal", className)} {...props} />
}

/** The list's search: an icon, the input, and the key that focuses it. */
export function SearchBox({
  shortcut = "/",
  className,
  ...props
}: React.ComponentProps<"input"> & { shortcut?: string | null }) {
  return (
    <label
      className={cn(
        "flex h-8.5 items-center gap-2 rounded-lg bg-l3 pr-2 pl-[11px] text-fg-3 inset-ring inset-ring-line transition-shadow duration-150",
        // focus-within: the BOX lights up when the input inside it has focus
        "focus-within:inset-ring-line-3 focus-within:ring-[3px] focus-within:ring-focus-glow has-disabled:opacity-40 has-aria-invalid:inset-ring-red/60",
        // the page's pinned-state demos set data-preview on the input
        "has-data-[preview~=focus]:inset-ring-line-3 has-data-[preview~=focus]:ring-[3px] has-data-[preview~=focus]:ring-focus-glow",
        className
      )}
    >
      <SearchIcon className="size-3.5 shrink-0" />
      <input className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-3" {...props} />
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </label>
  )
}

/** A label, the control, and one line under it that is either help or the error, never both. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  aside,
  className,
  children,
}: {
  label: string
  htmlFor: string
  hint?: React.ReactNode
  error?: React.ReactNode
  /** Sits at the right end of the line under the control, e.g. a character counter. */
  aside?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {(hint || error || aside) && (
        <div className="flex justify-between gap-3 text-xs">
          <span className={error ? "text-danger-fg" : "text-fg-3"}>{error || hint}</span>
          {aside}
        </div>
      )}
    </div>
  )
}
