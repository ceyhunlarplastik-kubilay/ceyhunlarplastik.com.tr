import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DContent } from "@/features/public/3d/components/3DContent";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.printing3d.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: locale === "tr" ? "/3d-baski-ve-tarama" : "/en/3d-baski-ve-tarama",
            languages: {
                tr: "/3d-baski-ve-tarama",
                en: "/en/3d-baski-ve-tarama",
                "x-default": "/3d-baski-ve-tarama",
            },
        },
        openGraph: {
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
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
