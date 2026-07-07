import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Providers } from "../providers";
import { baseMetadata } from "../sharedMetadata";
import { bodyFontClassName } from "../fonts";
import "../globals.css";

export const metadata: Metadata = baseMetadata;

// İki locale de build sırasında üretilir; setRequestLocale ile birlikte
// public sayfaların STATIC kalmasını sağlar (next-intl olmadan da static'tiler —
// bu davranış korunmak zorunda, yoksa public katalog dynamic'e düşer).
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }
    setRequestLocale(locale);

    return (
        <html lang={locale} suppressHydrationWarning>
            <body suppressHydrationWarning className={bodyFontClassName}>
                <Providers>
                    <NextIntlClientProvider>{children}</NextIntlClientProvider>
                </Providers>
            </body>
        </html>
    );
}
