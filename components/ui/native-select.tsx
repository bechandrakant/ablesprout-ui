import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** Native <select>: best keyboard/screen-reader support and the OS picker on Android. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select data-slot="native-select" className="field appearance-none pr-10" {...props}>
        {children}
      </select>
      <ChevronDownIcon aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { NativeSelect }
