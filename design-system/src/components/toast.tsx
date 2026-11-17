/* The confirmation after an action: glass, bottom right, gone on its own.
 * sonner decides when it appears and leaves; this file is only what it looks like.
 * Put <Toaster /> once at the root of the app, then call notify() from anywhere. */
import { CheckIcon, XIcon } from "lucide-react"
import { Toaster as Sonner, toast } from "sonner"

import { cn } from "@/lib/utils"

export function Toaster() {
  return <Sonner position="bottom-right" />
}

export function notify({ title, description, tone = "done" }: { title: string; description?: string; tone?: "done" | "failed" | "plain" }) {
  toast.custom(() => (
    <div className="glass-toast flex w-[340px] items-center gap-3 px-3.5 py-3 text-base text-fg">
      {tone !== "plain" && (
        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", tone === "done" ? "bg-primary text-primary-fg" : "bg-red-wash text-danger-fg inset-ring inset-ring-red/35")}>
          {tone === "done" ? <CheckIcon className="size-[13px]" strokeWidth={2.5} /> : <XIcon className="size-[13px]" strokeWidth={2.5} />}
        </span>
      )}
      <div className="min-w-0">
        <div className="font-semibold">{title}</div>
        {description && <div className="truncate text-xs text-fg-2">{description}</div>}
      </div>
    </div>
  ))
}
