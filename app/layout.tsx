import type { Metadata, Viewport } from "next";
import { Inter, Lexend, Poppins } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers/providers";
import "./globals.css";

// Self-hosted at build time by next/font: no runtime requests to Google, small subsets only.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-poppins", display: "swap" });
// Lexend: research-backed for reading fluency; used by the dyslexia-friendly toggle.
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap", preload: false });

export const metadata: Metadata = {
  title: { default: "AbleSprout – Support for every learner", template: "%s · AbleSprout" },
  description:
    "AI-powered Inclusive Education OS for Indian schools: assessments, AI IEPs, adapted worksheets, progress tracking and parent collaboration.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563EB",
};

// Applies saved accessibility preferences before first paint (no flash of the wrong size/font).
const a11yBootstrap = `try{var p=JSON.parse(localStorage.getItem('as_a11y')||'{}');var d=document.documentElement;if(p.largeText)d.dataset.text='large';if(p.dyslexicFont)d.dataset.font='dyslexic';}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${inter.variable} ${poppins.variable} ${lexend.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: a11yBootstrap }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
