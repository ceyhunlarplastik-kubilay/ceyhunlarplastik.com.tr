import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MassProductionContent } from "@/features/public/massProduction/components/MassProductionContent";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.massProduction.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: locale === "tr" ? "/seri-uretim" : "/en/seri-uretim",
            languages: {
                tr: "/seri-uretim",
                en: "/en/seri-uretim",
                "x-default": "/seri-uretim",
            },
        },
        openGraph: {
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
        },
    };
}

export default async function MassProductionPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <MassProductionContent />;
}
