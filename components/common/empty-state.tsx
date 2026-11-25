import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-2xl border border-dashed border-input bg-white/60 px-6 py-10 text-center", className)}>
      <span className="grid size-14 place-items-center rounded-full bg-accent text-primary" aria-hidden>
        <Icon className="size-7" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {body && <p className="max-w-md text-muted-foreground">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
