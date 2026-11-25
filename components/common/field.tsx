import { cn } from "@/lib/utils";

/** Label + control + hint + error, wired up with ids for screen readers. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-medium text-ink">
        {label}
        {required && (
          <span aria-hidden className="text-destructive">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** aria props for an input rendered inside <Field>. */
export const fieldAria = (id: string, error?: string, hint?: boolean) => ({
  id,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});
