import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArgeContent } from "@/features/public/arge/components/ArgeContent";
import { buildStaticAlternates } from "@/i18n/alternates";
import { getOgLocale } from "@/i18n/localeMetadata";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.arge.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: buildStaticAlternates(locale, "/arge-ve-prototipleme"),
        openGraph: {
            type: "website",
            locale: getOgLocale(locale),
        },
    };
}

export default async function ArgePage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <main>
            <ArgeContent />
        </main>
    );
}
