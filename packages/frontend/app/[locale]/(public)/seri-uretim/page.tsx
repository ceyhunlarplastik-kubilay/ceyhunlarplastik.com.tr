import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MassProductionContent } from "@/features/public/massProduction/components/MassProductionContent";
import { buildStaticAlternates } from "@/i18n/alternates";
import { getOgLocale } from "@/i18n/localeMetadata";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.massProduction.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: buildStaticAlternates(locale, "/seri-uretim"),
        openGraph: {
            type: "website",
            locale: getOgLocale(locale),
        },
    };
}

export default async function MassProductionPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <MassProductionContent />;
}
