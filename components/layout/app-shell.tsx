"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, Settings, Users, GraduationCap, UserCircle2 } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageSwitcher } from "./language-switcher";
import { A11yToggle } from "./a11y-toggle";
import { useAuth } from "@/components/providers/auth-provider";
import { ErrorState } from "@/components/common/error-state";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/api";

interface NavItem {
  href: string;
  key: "dashboard" | "students" | "myChildren" | "team" | "settings";
  icon: typeof LayoutDashboard;
  roles: Role[];
}
const NAV: NavItem[] = [
  { href: "/app/dashboard", key: "dashboard", icon: LayoutDashboard, roles: ["ADMIN", "EDUCATOR", "PARENT"] },
  { href: "/app/students", key: "students", icon: GraduationCap, roles: ["ADMIN", "EDUCATOR"] },
  { href: "/app/students", key: "myChildren", icon: GraduationCap, roles: ["PARENT"] },
  { href: "/app/team", key: "team", icon: Users, roles: ["ADMIN"] },
  { href: "/app/settings", key: "settings", icon: Settings, roles: ["ADMIN", "EDUCATOR", "PARENT"] },
];

function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-1">
      {NAV.filter((n) => n.roles.includes(role)).map(({ href, key, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <li key={key}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium transition-colors",
                active ? "bg-primary text-white shadow-soft" : "text-ink hover:bg-accent",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {t(key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const t = useTranslations("nav");
  const tr = useTranslations("enums.role");
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="gap-2 px-2" aria-label={t("account")}>
            <UserCircle2 className="size-6 text-primary" aria-hidden />
            <span className="hidden max-w-40 truncate lg:inline">{user.name}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-base">
            <span className="block font-semibold text-ink">{user.name}</span>
            <span className="block text-muted-foreground">{tr(user.role)}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-11 text-base" render={<Link href="/app/settings" />}>
          <Settings aria-hidden /> {t("settings")}
        </DropdownMenuItem>
        <DropdownMenuItem className="min-h-11 text-base" onClick={() => logout()}>
          <LogOut aria-hidden /> {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, status, error, retry, logout } = useAuth();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <a href="#main" className="skip-link">
        {tc("skipToContent")}
      </a>
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-white px-4 py-5 lg:flex">
        <Logo href="/app/dashboard" className="mb-8 px-2" />
        <nav aria-label={t("mainNav")} className="flex-1">
          {user ? <NavLinks role={user.role} /> : <Skeleton className="h-40 w-full" />}
        </nav>
        {user && (
          <Button variant="ghost" className="justify-start gap-3" onClick={() => logout()}>
            <LogOut className="size-5" aria-hidden /> {t("signOut")}
          </Button>
        )}
      </aside>

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex items-center gap-2 border-b bg-background/90 px-4 py-2 backdrop-blur">
          <Button variant="outline" size="icon" className="lg:hidden" aria-label={tc("openMenu")} onClick={() => setOpen(true)}>
            <Menu aria-hidden />
          </Button>
          <Logo href="/app/dashboard" compact className="lg:hidden" />
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <A11yToggle compact />
            <UserMenu />
          </div>
        </header>

        <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 outline-none sm:px-6 lg:py-8">
          {status === "authenticated" ? (
            children
          ) : status === "error" ? (
            <ErrorState error={new Error(error)} onRetry={retry} />
          ) : (
            <div className="space-y-4" aria-busy="true" aria-label={tc("loading")}>
              <Skeleton className="h-10 w-64" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          )}
        </main>
      </div>

      {/* Mobile navigation drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-5">
          <SheetTitle className="sr-only">{t("mainNav")}</SheetTitle>
          <Logo href="/app/dashboard" className="mb-6" />
          <nav aria-label={t("mainNav")}>{user && <NavLinks role={user.role} onNavigate={() => setOpen(false)} />}</nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
