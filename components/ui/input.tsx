import * as React from "react"
import { cn } from "@/lib/utils"

// Plain native input (works with react-hook-form `register`, light on low-end phones).
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn("field", className)} {...props} />
}

export { Input }
