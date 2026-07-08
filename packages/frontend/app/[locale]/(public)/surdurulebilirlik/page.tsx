import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Enviroment } from "@/components/home/Enviroment";
import { SustainabilityIntro } from "@/features/public/sustainability/components/SustainabilityIntro";
import { SustainabilityImpact } from "@/features/public/sustainability/components/SustainabilityImpact";
import { SustainabilityEnergy } from "@/features/public/sustainability/components/SustainabilityEnergy";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.sustainability.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: locale === "tr" ? "/surdurulebilirlik" : "/en/surdurulebilirlik",
            languages: {
                tr: "/surdurulebilirlik",
                en: "/en/surdurulebilirlik",
                "x-default": "/surdurulebilirlik",
            },
        },
        openGraph: {
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
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
