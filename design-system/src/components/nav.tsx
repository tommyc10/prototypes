/* The sidebar's pieces. The sidebar is l0, the heaviest material, so it recedes.
 * The current page is a raised chip, like every other "you are here". */
import * as React from "react"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Kbd } from "./kbd"

export function BrandMark({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-2 pt-1 pb-3.5 font-semibold tracking-[-0.01em]">
      <span className="grid size-[22px] place-items-center rounded-sm bg-primary text-primary-fg">
        <svg viewBox="0 0 24 24" className="size-3.5">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      </span>
      {children}
    </div>
  )
}

/** The "Search or jump to…" button at the top of the sidebar: it opens the palette. */
export function JumpButton({ children, className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-lg bg-l3 pr-1.5 pl-2.5 text-left text-sm text-fg-3 inset-ring inset-ring-line transition-[background-color,scale] duration-150 ease-out hover:bg-l4 active:scale-[0.98]",
        className
      )}
      {...props}
    >
      <SearchIcon className="size-3.5" />
      <span className="flex-1">{children}</span>
      <Kbd>⌘K</Kbd>
    </button>
  )
}

export function NavItem({ active, className, ...props }: React.ComponentProps<"a"> & { active?: boolean }) {
  return (
    <a
      data-active={active || undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-base text-fg-2 transition-colors duration-150 [&>svg]:size-4 [&>svg]:text-fg-3",
        "hover:bg-l3 hover:text-fg data-active:bg-chip data-active:font-medium data-active:text-fg data-active:shadow-chip data-active:[&>svg]:text-fg",
        // inside a list, the focus outline sits just inside the edge
        "focus-visible:outline-offset-[-2px]!",
        className
      )}
      {...props}
    />
  )
}
