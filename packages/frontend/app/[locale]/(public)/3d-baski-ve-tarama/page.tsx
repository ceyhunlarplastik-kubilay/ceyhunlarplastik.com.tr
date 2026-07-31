import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DContent } from "@/features/public/3d/components/3DContent";
import { buildStaticAlternates } from "@/i18n/alternates";
import { getOgLocale } from "@/i18n/localeMetadata";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.printing3d.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: buildStaticAlternates(locale, "/3d-baski-ve-tarama"),
        openGraph: {
            type: "website",
            locale: getOgLocale(locale),
        },
    };
}

export default async function DPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <main>
            <DContent />
        </main>
    );
}
