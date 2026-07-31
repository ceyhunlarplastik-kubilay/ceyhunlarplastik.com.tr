import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Enviroment } from "@/components/home/Enviroment";
import { SustainabilityIntro } from "@/features/public/sustainability/components/SustainabilityIntro";
import { SustainabilityImpact } from "@/features/public/sustainability/components/SustainabilityImpact";
import { SustainabilityEnergy } from "@/features/public/sustainability/components/SustainabilityEnergy";
import { buildStaticAlternates } from "@/i18n/alternates";
import { getOgLocale } from "@/i18n/localeMetadata";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.sustainability.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: buildStaticAlternates(locale, "/surdurulebilirlik"),
        openGraph: {
            type: "website",
            locale: getOgLocale(locale),
        },
    };
}

export default async function SustainabilityPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <main>
            <Enviroment fullScreen />
            <SustainabilityIntro />
            <SustainabilityImpact />
            <SustainabilityEnergy />
        </main>
    );
}
