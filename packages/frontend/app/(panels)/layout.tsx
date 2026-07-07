import type { Metadata } from "next";
import { Providers } from "../providers";
import { baseMetadata } from "../sharedMetadata";
import { bodyFontClassName } from "../fonts";
import "../globals.css";

export const metadata: Metadata = baseMetadata;

/**
 * Panel route'larının (admin, musteri, satis, satinalma, veri-girisi,
 * tedarikci, supplier, protected, hesabim) root layout'u.
 *
 * Paneller BİLİNÇLİ olarak [locale] ağacının dışında tutuluyor (i18n Faz 2
 * kararına kadar TR-only):
 * - proxy.ts'teki withAuth matcher'ı bu path'leri korur; [locale] altına
 *   taşınsalardı /en/admin/... matcher'dan kaçar ve auth bypass doğardı.
 * - /en/admin gibi bir yüzey hiç oluşmaz.
 * Paneller Faz 2'de çevrilecekse bu grup [locale] altına taşınır ve matcher
 * locale-aware yapılır — ikisi AYNI değişiklikte yapılmak zorunda.
 */
export default function PanelsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="tr" suppressHydrationWarning>
            <body suppressHydrationWarning className={bodyFontClassName}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
