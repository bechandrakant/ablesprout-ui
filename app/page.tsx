import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  HeartHandshake,
  LineChart,
  Lock,
  Mail,
  Sparkles,
  Clock,
  EyeOff,
  HelpCircle,
} from "lucide-react";
import { Logo } from "@/components/common/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { A11yToggle } from "@/components/layout/a11y-toggle";
import { PilotForm } from "@/components/landing/pilot-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  const problems = [
    { icon: Clock, title: t("problem1Title"), body: t("problem1Body") },
    { icon: EyeOff, title: t("problem2Title"), body: t("problem2Body") },
    { icon: HelpCircle, title: t("problem3Title"), body: t("problem3Body") },
  ];
  const modules = [
    { icon: ClipboardCheck, title: t("m1Title"), body: t("m1Body"), tone: "bg-blue-50 text-blue-700" },
    { icon: Sparkles, title: t("m2Title"), body: t("m2Body"), tone: "bg-teal-50 text-teal-800" },
    { icon: FileText, title: t("m3Title"), body: t("m3Body"), tone: "bg-amber-50 text-amber-800" },
    { icon: LineChart, title: t("m4Title"), body: t("m4Body"), tone: "bg-blue-50 text-blue-700" },
    { icon: HeartHandshake, title: t("m5Title"), body: t("m5Body"), tone: "bg-teal-50 text-teal-800" },
    { icon: BarChart3, title: t("m6Title"), body: t("m6Body"), tone: "bg-amber-50 text-amber-800" },
  ];
  const audience = [t("aud1"), t("aud2"), t("aud3"), t("aud4"), t("aud5"), t("aud6")];

  return (
    <>
      <a href="#main" className="skip-link">
        {tc("skipToContent")}
      </a>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <nav aria-label={tc("appName")} className="hidden items-center gap-6 font-medium md:flex">
            <a href="#modules" className="hover:text-primary">{t("navFeatures")}</a>
            <a href="#audience" className="hover:text-primary">{t("navForWhom")}</a>
            <a href="#pilot" className="hover:text-primary">{t("navPilot")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <A11yToggle compact />
            <Link href="/login" className={buttonVariants({ variant: "default" })}>
              {t("ctaSignIn")}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -top-24 right-0 size-96 rounded-full bg-brand-teal/15 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 size-80 rounded-full bg-brand-blue/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground">
                <Sparkles className="size-4" aria-hidden /> {tc("tagline")}
              </p>
              <h1 className="text-4xl leading-tight font-bold sm:text-5xl">{t("heroTitle")}</h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t("heroBody")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#pilot" className={cn(buttonVariants({ size: "lg" }), "bg-brand-orange text-ink hover:bg-amber-400")}>
                  {t("ctaPilot")}
                </a>
                <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
                  {t("ctaSignIn")}
                </Link>
              </div>
              <LanguageSwitcher className="mt-6 sm:hidden" />
            </div>
            <ul className="grid content-center gap-3">
              {[t("heroStat1"), t("heroStat2"), t("heroStat3")].map((s, i) => (
                <li key={s} className="card-soft flex items-center gap-3 p-4">
                  <span className={cn("grid size-10 place-items-center rounded-xl font-bold", ["bg-blue-100 text-blue-800", "bg-teal-100 text-teal-900", "bg-amber-100 text-amber-900"][i])} aria-hidden>
                    {i + 1}
                  </span>
                  <span className="font-medium">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Problem */}
        <section aria-labelledby="problem-title" className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="problem-title" className="text-center text-3xl font-bold">{t("problemTitle")}</h2>
            <ul className="mt-10 grid gap-5 md:grid-cols-3">
              {problems.map(({ icon: Icon, title, body }) => (
                <li key={title} className="rounded-2xl border bg-background p-6">
                  <Icon className="size-8 text-brand-orange" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Modules */}
        <section id="modules" aria-labelledby="modules-title" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="modules-title" className="text-center text-3xl font-bold">{t("modulesTitle")}</h2>
            <p className="mt-3 text-center text-muted-foreground">{t("modulesBody")}</p>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map(({ icon: Icon, title, body, tone }) => (
                <li key={title} className="card-soft p-6">
                  <span className={cn("grid size-12 place-items-center rounded-xl", tone)} aria-hidden>
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Audience + India */}
        <section id="audience" aria-labelledby="aud-title" className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 id="aud-title" className="text-3xl font-bold">{t("audienceTitle")}</h2>
            <ul className="mt-8 flex flex-wrap justify-center gap-3">
              {audience.map((a) => (
                <li key={a} className="rounded-full border-2 border-brand-teal/40 bg-secondary px-4 py-2 font-medium text-secondary-foreground">
                  {a}
                </li>
              ))}
            </ul>
            <div className="mx-auto mt-14 grid max-w-4xl gap-5 text-left md:grid-cols-2">
              <div className="rounded-2xl bg-gradient-to-br from-brand-blue to-blue-800 p-6 text-white">
                <h3 className="text-xl font-semibold text-white">{t("indiaTitle")}</h3>
                <p className="mt-2 font-semibold tracking-wide">NEP 2020 · RPwD Act 2016 · DPDP Act 2023</p>
                <p className="mt-3 text-blue-50">{t("indiaBody")}</p>
              </div>
              <div className="rounded-2xl border bg-background p-6">
                <Lock className="size-7 text-brand-teal-dark" aria-hidden />
                <h3 className="mt-3 text-xl font-semibold">{t("privacyTitle")}</h3>
                <p className="mt-2 text-muted-foreground">{t("privacyBody")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pilot CTA */}
        <section id="pilot" aria-labelledby="pilot-title" className="py-16">
          <div className="mx-auto max-w-3xl px-4">
            <div className="card-soft p-6 sm:p-10">
              <h2 id="pilot-title" className="text-3xl font-bold">{t("pilotTitle")}</h2>
              <p className="mt-2 mb-6 text-muted-foreground">{t("pilotBody")}</p>
              <PilotForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="flex items-center gap-2">
            <Mail className="size-5 text-primary" aria-hidden />
            <span className="sr-only">{t("footerContact")}: </span>
            <a href="mailto:hello@ablesprout.com" className="font-medium text-primary underline-offset-4 hover:underline">
              hello@ablesprout.com
            </a>
          </p>
          <p className="text-muted-foreground">{t("footerRights", { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </>
  );
}
