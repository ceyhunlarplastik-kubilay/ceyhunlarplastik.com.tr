import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AboutHero from "@/features/public/about/components/AboutHero";
import AboutContent from "@/features/public/about/components/AboutContent";
import AboutCategories from "@/features/public/about/components/AboutCategories";
import { AboutDetails } from "@/features/public/about/components/AboutDetails";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.about.meta" });

    return {
        // Root layout template'i "| Ceyhunlar Plastik" ekler; burada yalnız sayfa adı.
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: locale === "tr" ? "/hakkimizda" : "/en/hakkimizda",
            languages: {
                tr: "/hakkimizda",
                en: "/en/hakkimizda",
                "x-default": "/hakkimizda",
            },
        },
        openGraph: {
            description: t("ogDescription"),
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
            // Not: eski koddaki `url: "/hakkimizda.jpg"` bir bug'dı (sayfa URL'i yerine
            // görsel path'i) — canonical/alternates bunu doğru şekilde karşılıyor.
            images: [
                {
                    url: "/hakkimizda.jpg",
                    width: 1200,
                    height: 630,
                    alt: t("ogImageAlt"),
                },
            ],
        },
    };
}

export default async function AboutPage({ params }: PageProps) {
    const { locale } = await params;
    // Static rendering için zorunlu (bkz. app/[locale]/layout.tsx notu).
    setRequestLocale(locale);

    return (
        <main>
            <AboutHero />
            <AboutContent />
            <AboutCategories />
            <AboutDetails />
        </main>
    );
}
