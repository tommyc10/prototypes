/* Things that appear above the page. Behaviour (positioning, focus, Esc, arrow keys) comes
 * from Base UI, an unstyled library; every class here is ours.
 *
 * Small ones that belong to a control (menu, popover) are GLASS.
 * Big ones you work inside (dialog) are SOLID, over a plain dim.
 * The tooltip is solid too, because it often sits on bright chart marks.
 *
 * Base UI marks an element with data-starting-style for its first frame and
 * data-ending-style for its last, which is what the scale-and-fade below hangs on. */
import * as React from "react"
import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import { Menu as BaseMenu } from "@base-ui/react/menu"
import { Popover as BasePopover } from "@base-ui/react/popover"
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Base UI lets className be a function of state; ours are always plain strings.
type Plain<Props> = Omit<Props, "className"> & { className?: string }

// Scale in from the trigger: 0.96 to 1 over 150ms.
const POP = "origin-(--transform-origin) outline-none transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-[0.96] data-starting-style:opacity-0 data-ending-style:scale-[0.96] data-ending-style:opacity-0"

/* ---------- menu ---------- */

export const Menu = BaseMenu.Root
export const MenuTrigger = BaseMenu.Trigger
export const MenuRadioGroup = BaseMenu.RadioGroup

export function MenuContent({ align = "start", className, ...props }: Plain<BaseMenu.Popup.Props> & { align?: "start" | "center" | "end" }) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner align={align} sideOffset={6} className="z-50 outline-none">
        <BaseMenu.Popup className={cn("glass-menu min-w-[180px] p-1", POP, className)} {...props} />
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
}

// 30px tall, 6px corners. data-highlighted is the hovered or arrowed-to item.
const ITEM = "flex h-[30px] cursor-default items-center gap-2 rounded-sm px-2.5 text-sm font-medium text-fg-2 outline-none select-none data-highlighted:bg-tint-2 data-highlighted:text-fg data-disabled:opacity-40"

export function MenuItem({ danger, className, ...props }: Plain<BaseMenu.Item.Props> & { danger?: boolean }) {
  return <BaseMenu.Item className={cn(ITEM, danger && "text-danger-fg data-highlighted:bg-red-wash data-highlighted:text-danger-fg", className)} {...props} />
}

/** One of a set; the chosen one shows a tick. */
export function MenuRadioItem({ className, children, ...props }: Plain<BaseMenu.RadioItem.Props>) {
  return (
    <BaseMenu.RadioItem className={cn(ITEM, "pl-1.5 data-checked:text-fg", className)} {...props}>
      <span className="flex w-[18px]">
        <BaseMenu.RadioItemIndicator>
          <CheckIcon className="size-3.5" strokeWidth={2.5} />
        </BaseMenu.RadioItemIndicator>
      </span>
      {children}
    </BaseMenu.RadioItem>
  )
}

export function MenuLabel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-2.5 pt-1.5 pb-1 text-xs font-medium text-fg-3", className)} {...props} />
}

export function MenuSeparator() {
  return <BaseMenu.Separator className="m-1 h-px bg-line" />
}

/* ---------- popover ---------- */

export const Popover = BasePopover.Root
export const PopoverTrigger = BasePopover.Trigger

export function PopoverContent({ align = "start", className, ...props }: Plain<BasePopover.Popup.Props> & { align?: "start" | "center" | "end" }) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner align={align} sideOffset={6} className="z-50">
        <BasePopover.Popup className={cn("glass-menu w-72 p-3 text-sm", POP, className)} {...props} />
      </BasePopover.Positioner>
    </BasePopover.Portal>
  )
}

/* ---------- tooltip ---------- */

export const TooltipProvider = BaseTooltip.Provider

/** Names a control. `children` is the trigger element. */
export function Tooltip({ label, children }: { label: React.ReactNode; children: React.ReactElement<Record<string, unknown>> }) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner sideOffset={6} className="z-50">
          <BaseTooltip.Popup className={cn("surface-tip flex items-center gap-1.5 px-[11px] py-2 text-xs text-fg-2", POP)}>
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}

/* ---------- dialog ---------- */

export const Dialog = BaseDialog.Root
export const DialogTrigger = BaseDialog.Trigger
export const DialogClose = BaseDialog.Close

/** Solid, 14px corners, the biggest shadow. The page behind is dimmed, never blurred. */
export function DialogContent({
  title,
  description,
  className,
  children,
  ...props
}: Omit<Plain<BaseDialog.Popup.Props>, "title"> & { title: React.ReactNode; description?: React.ReactNode }) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-overlay transition-opacity duration-[180ms] ease-out data-starting-style:opacity-0 data-ending-style:opacity-0" />
      <BaseDialog.Popup
        className={cn(
          "surface-dialog fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-96px)] w-[min(520px,calc(100vw-48px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 p-5 outline-none",
          "transition-[opacity,scale] duration-[180ms] ease-out data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0",
          className
        )}
        {...props}
      >
        <div>
          {/* Every dialog has a title, so a screen reader can announce what just opened. */}
          <BaseDialog.Title className="type-card-title">{title}</BaseDialog.Title>
          {description && <BaseDialog.Description className="mt-1 text-sm leading-normal text-fg-2">{description}</BaseDialog.Description>}
        </div>
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  )
}
