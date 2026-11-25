import Link from "next/link";
import { cn } from "@/lib/utils";

/** Inline SVG sprout mark: no image request, crisp at any size. */
export function Logo({ href = "/", className, compact = false }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 rounded-lg font-heading text-xl font-bold text-ink", className)}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#2563EB" />
        <path d="M16 25V15" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M16 16c0-4.5 3-7 7.5-7 0 4.5-3 7-7.5 7Z" fill="#14B8A6" />
        <path d="M16 18.5c0-3.6-2.4-5.6-6-5.6 0 3.6 2.4 5.6 6 5.6Z" fill="#F59E0B" />
      </svg>
      {!compact && (
        <span>
          Able<span className="text-primary">Sprout</span>
        </span>
      )}
    </Link>
  );
}
