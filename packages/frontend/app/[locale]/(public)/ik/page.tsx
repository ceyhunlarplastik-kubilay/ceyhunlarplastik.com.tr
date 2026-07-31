import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HrHero, HrContactForm } from "@/features/public/hr";
import { siteUrl } from "@/app/sharedMetadata";
import { getOgLocale } from "@/i18n/localeMetadata";
import { buildStaticAlternates, localePath } from "@/i18n/alternates";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.hr.meta" });

    const path = localePath(locale, "/ik");
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: t("structuredDataName"),
        description: t("structuredDataDescription"),
        url: `${siteUrl}${path}`,
    };

    return {
        title: t("title"),
        description: t("description"),
        keywords: t.raw("keywords") as string[],
        alternates: buildStaticAlternates(locale, "/ik"),
        openGraph: {
            description: t("ogDescription"),
            type: "website",
            locale: getOgLocale(locale),
            images: [
                {
                    url: "/logos/hr.jpg",
                    width: 1200,
                    height: 630,
                    alt: t("ogImageAlt"),
                },
            ],
        },
        other: {
            "application/ld+json": JSON.stringify(structuredData),
        },
    };
}

export default async function HumanResources({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <main>
            <HrHero />
            <HrContactForm />
        </main>
    );
}
