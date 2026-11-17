/* An editable stylesheet. The grey box IS a real <style> tag that happens to be visible,
 * so typing in it restyles the page as you type. The same trick as the style cheat sheet. */
import * as React from "react"
import { CopyIcon, RotateCcwIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { copy } from "./doc"

export function LiveCss({
  title,
  css,
  className,
}: {
  title: React.ReactNode
  css: string
  className?: string
}) {
  const ref = React.useRef<HTMLStyleElement>(null)
  const initial = css.trim()

  // Set once by hand: React must not re-render over what you have typed.
  React.useEffect(() => {
    if (ref.current && !ref.current.textContent) ref.current.textContent = initial
  }, [initial])

  return (
    <div className={cn("overflow-hidden rounded-2xl bg-l1 inset-ring inset-ring-line", className)}>
      <div className="flex h-8.5 items-center gap-1 border-b pr-1.5 pl-3.5 text-xs text-fg-3">
        <span className="flex-1 truncate [&_b]:font-medium [&_b]:text-fg-2">{title}</span>
        <span className="mr-1 flex items-center gap-1.5 text-green">
          <span className="size-1.5 rounded-full bg-green" /> Live: edit me
        </span>
        <button
          className="flex h-6 items-center gap-1.5 rounded-sm px-2 text-xs font-medium text-fg-2 transition-colors duration-150 hover:bg-l4 hover:text-fg"
          onClick={() => ref.current && (ref.current.textContent = initial)}
        >
          <RotateCcwIcon className="size-3" /> Reset
        </button>
        <button
          className="flex h-6 items-center gap-1.5 rounded-sm px-2 text-xs font-medium text-fg-2 transition-colors duration-150 hover:bg-l4 hover:text-fg"
          onClick={() => ref.current && copy(ref.current.textContent ?? "", "CSS copied")}
        >
          <CopyIcon className="size-3" /> Copy
        </button>
      </div>
      <style
        ref={ref}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        spellCheck={false}
        className="block max-h-[460px] overflow-auto px-4 py-3.5 font-mono text-xs leading-[1.75] whitespace-pre text-fg-2 outline-none [tab-size:2] focus:bg-tint focus:text-fg"
      />
    </div>
  )
}
