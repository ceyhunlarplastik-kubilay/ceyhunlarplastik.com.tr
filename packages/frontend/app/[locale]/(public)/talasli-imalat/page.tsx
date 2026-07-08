import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MachiningContent } from "@/features/public/machining/components/MachiningContent";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.machining.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: locale === "tr" ? "/talasli-imalat" : "/en/talasli-imalat",
            languages: {
                tr: "/talasli-imalat",
                en: "/en/talasli-imalat",
                "x-default": "/talasli-imalat",
            },
        },
        openGraph: {
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
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
