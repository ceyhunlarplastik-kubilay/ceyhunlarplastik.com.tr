import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MachiningContent } from "@/features/public/machining/components/MachiningContent";
import { buildStaticAlternates } from "@/i18n/alternates";
import { getOgLocale } from "@/i18n/localeMetadata";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.machining.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: buildStaticAlternates(locale, "/talasli-imalat"),
        openGraph: {
            type: "website",
            locale: getOgLocale(locale),
        },
    };
}

export default async function MachiningPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <main>
            <MachiningContent />
        </main>
    );
}
