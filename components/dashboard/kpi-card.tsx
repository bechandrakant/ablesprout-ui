import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({ icon: Icon, label, value, hint, tone = "blue" }: { icon: LucideIcon; label: string; value: React.ReactNode; hint?: string; tone?: "blue" | "teal" | "orange" | "slate" }) {
  const tones = {
    blue: "bg-blue-100 text-blue-800",
    teal: "bg-teal-100 text-teal-900",
    orange: "bg-amber-100 text-amber-900",
    slate: "bg-slate-100 text-slate-800",
  };
  return (
    <div className="card-soft flex items-start gap-4 p-5">
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", tones[tone])} aria-hidden>
        <Icon className="size-6" />
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-heading text-3xl font-bold text-ink">{value}</p>
        {hint && <p className="text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
