import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TermsContent } from "@/features/public/terms/components/TermsContent";
import { buildStaticAlternates } from "@/i18n/alternates";
import { getOgLocale } from "@/i18n/localeMetadata";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.terms.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: buildStaticAlternates(locale, "/kullanim-kosullari"),
        openGraph: {
            description: t("ogDescription"),
            type: "website",
            locale: getOgLocale(locale),
        },
    };
}

export default async function TermsPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <TermsContent />;
}
