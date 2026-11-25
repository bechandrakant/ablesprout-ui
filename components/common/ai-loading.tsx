import { Sparkles } from "lucide-react";

/** Calm, explicit progress state for long-running AI actions (announced to screen readers). */
export function AiLoading({ title, steps, hint }: { title: string; steps?: string; hint?: string }) {
  return (
    <div role="status" aria-live="polite" className="card-soft flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="relative grid size-16 place-items-center rounded-full bg-gradient-to-br from-brand-blue to-brand-teal text-white">
        <Sparkles className="size-7 motion-safe:animate-pulse" aria-hidden />
        <span className="absolute inset-0 rounded-full border-4 border-white/40 motion-safe:animate-ping" aria-hidden />
      </span>
      <p className="text-lg font-semibold">{title}</p>
      {steps && <p className="text-muted-foreground">{steps}</p>}
      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full w-1/3 rounded-full bg-primary motion-safe:animate-[indeterminate_1.6s_ease-in-out_infinite]" />
      </div>
      {hint && <p className="max-w-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
