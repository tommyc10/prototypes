/* The same thing written several ways, one line each. Clicking a line copies it. */
import { cn } from "@/lib/utils"
import { copy } from "./doc"

export function CopyRows({ rows, className }: { rows: [label: string, lines: string[]][]; className?: string }) {
  return (
    <div className={cn("px-1.5 pb-1.5", className)}>
      {rows.map(([label, lines]) => (
        <div key={label} className="grid grid-cols-[54px_minmax(0,1fr)] items-baseline border-t py-[3px]">
          <span className="pl-1.5 text-[11px] text-fg-3">{label}</span>
          <div className="flex min-w-0 flex-col items-start">
            {lines.map((line) => (
              <button
                key={line}
                title="Click to copy"
                onClick={() => copy(line, `${label} copied`)}
                className="max-w-full rounded-sm px-1.5 py-[3px] text-left font-mono text-xs leading-[1.4] [overflow-wrap:anywhere] whitespace-pre-wrap text-fg-2 transition-[scale,background-color,color] duration-150 ease-out hover:bg-l5 hover:text-fg active:scale-[0.97]"
              >
                {line}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
