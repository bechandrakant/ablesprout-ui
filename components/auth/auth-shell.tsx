import { Logo } from "@/components/common/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { A11yToggle } from "@/components/layout/a11y-toggle";

export function AuthShell({ title, subtitle, children, wide }: { title: string; subtitle?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top_right,#ccfbf1,transparent_55%),radial-gradient(ellipse_at_bottom_left,#dbeafe,transparent_50%)]">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <A11yToggle compact />
        </div>
      </header>
      <main id="main" className="mx-auto px-4 pb-16" style={{ maxWidth: wide ? "44rem" : "28rem" }}>
        <div className="card-soft p-6 sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 mb-6 text-muted-foreground">{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
