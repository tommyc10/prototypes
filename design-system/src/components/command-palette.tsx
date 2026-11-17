/* The ⌘K command palette. cmdk does the searching and the arrow keys; the look is ours.
 * It is the thinnest glass with the heaviest blur, over a light scrim, and it opens with
 * no animation at all: it is used a hundred times a day. */
import * as React from "react"
import { Command } from "cmdk"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const LIST = "max-h-[400px] overflow-y-auto p-1.5"
// cmdk renders the group heading itself, so it is styled through an attribute selector.
const GROUP = "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-fg-3"

function Body({ placeholder, children }: { placeholder: string; children: React.ReactNode }) {
  return (
    <>
      <div className="flex h-13 items-center gap-2.5 border-b px-4.5 text-fg-3">
        <SearchIcon className="size-4" />
        <Command.Input placeholder={placeholder} className="flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-3" />
      </div>
      <Command.List className={LIST}>
        <Command.Empty className="p-7 text-center text-sm text-fg-3">No results</Command.Empty>
        {children}
      </Command.List>
    </>
  )
}

export function CommandPalette({ open, onOpenChange, placeholder = "Search or run a command…", children }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  placeholder?: string
  children: React.ReactNode
}) {
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command menu"
      className="glass-palette overflow-hidden"
      overlayClassName="fixed inset-0 z-50 bg-scrim"
      contentClassName="fixed top-[16vh] left-1/2 z-[51] w-[620px] max-w-[calc(100vw-32px)] -translate-x-1/2"
    >
      <Body placeholder={placeholder}>{children}</Body>
    </Command.Dialog>
  )
}

/** The same palette drawn in the page instead of over it, for documentation. */
export function CommandPaletteInline({ placeholder = "Search or run a command…", className, children }: { placeholder?: string; className?: string; children: React.ReactNode }) {
  // A controlled value that starts on nothing stops cmdk scrolling its first item into view on load.
  const [value, setValue] = React.useState("-")
  return (
    <Command value={value} onValueChange={setValue} label="Command menu" className={cn("glass-palette w-full max-w-[620px] overflow-hidden", className)}>
      <Body placeholder={placeholder}>{children}</Body>
    </Command>
  )
}

export function PaletteGroup({ heading, children }: { heading: string; children: React.ReactNode }) {
  return <Command.Group heading={heading} className={GROUP}>{children}</Command.Group>
}

/** 38px tall. `meta` sits at the right end: a key cap or a quiet note. */
export function PaletteItem({ meta, children, className, ...props }: React.ComponentProps<typeof Command.Item> & { meta?: React.ReactNode }) {
  return (
    <Command.Item
      className={cn(
        "flex h-9.5 cursor-default items-center gap-2.5 rounded-lg px-3 text-base font-medium text-fg-2 data-[selected=true]:bg-tint-2 data-[selected=true]:text-fg [&>svg]:size-4 [&>svg]:text-fg-3",
        className
      )}
      {...props}
    >
      {children}
      {meta && <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-normal text-fg-3">{meta}</span>}
    </Command.Item>
  )
}
