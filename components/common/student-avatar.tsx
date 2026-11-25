import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const PALETTE = ["bg-blue-100 text-blue-900", "bg-teal-100 text-teal-900", "bg-amber-100 text-amber-900", "bg-violet-100 text-violet-900", "bg-rose-100 text-rose-900"];

export function StudentAvatar({ name, className }: { name: string; className?: string }) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
  return (
    <span aria-hidden className={cn("grid size-11 shrink-0 place-items-center rounded-full font-semibold", PALETTE[idx], className)}>
      {initials(name)}
    </span>
  );
}
