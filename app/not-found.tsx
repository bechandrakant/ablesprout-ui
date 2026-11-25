import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/common/logo";
import { buttonVariants } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <h1 className="text-2xl font-bold">{t("notFound")}</h1>
        <Link href="/app/dashboard" className={buttonVariants()}>{t("goToDashboard")}</Link>
      </div>
    </main>
  );
}
