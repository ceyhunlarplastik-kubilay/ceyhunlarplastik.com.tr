import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArgeContent } from "@/features/public/arge/components/ArgeContent";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.arge.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: locale === "tr" ? "/arge-ve-prototipleme" : "/en/arge-ve-prototipleme",
            languages: {
                tr: "/arge-ve-prototipleme",
                en: "/en/arge-ve-prototipleme",
                "x-default": "/arge-ve-prototipleme",
            },
        },
        openGraph: {
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
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
