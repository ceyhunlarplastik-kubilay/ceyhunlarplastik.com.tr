import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PrivacyContent } from "@/features/public/privacy/components/PrivacyContent";
import { buildStaticAlternates } from "@/i18n/alternates";
import { getOgLocale } from "@/i18n/localeMetadata";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.privacy.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: buildStaticAlternates(locale, "/gizlilik-politikasi"),
        openGraph: {
            description: t("ogDescription"),
            type: "website",
            locale: getOgLocale(locale),
        },
    };
}

export default async function PrivacyPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <PrivacyContent />;
}
