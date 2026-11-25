import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("signIn") };
}

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <AuthShell title={t("loginTitle")} subtitle={t("loginSubtitle")}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
