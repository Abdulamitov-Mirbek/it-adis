import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { CustomCursor } from "@/components/ui/CustomCursor";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IT ADIS — Advanced Digital Innovation School",
  description:
    "IT ADIS — Modern IT education center in Bishkek. Master Python, JavaScript, AI, Frontend, and Vibe Coding.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ru" | "kg")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="noise-bg antialiased">
        <NextIntlClientProvider messages={messages}>
          <SmoothScrollProvider>
            <CustomCursor />
            {children}
          </SmoothScrollProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
