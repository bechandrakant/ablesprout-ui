import { cn } from "@/lib/utils";

export function SectionCard({ title, action, children, className, id }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  const headingId = id ?? `sec-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={headingId} className={cn("card-soft p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-lg font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
