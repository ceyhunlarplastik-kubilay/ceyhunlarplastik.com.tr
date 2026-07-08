import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SuggestionForm } from "@/features/public/suggestion/components/SuggestionForm";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.suggestion.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: locale === "tr" ? "/oneri-sikayet" : "/en/oneri-sikayet",
            languages: {
                tr: "/oneri-sikayet",
                en: "/en/oneri-sikayet",
                "x-default": "/oneri-sikayet",
            },
        },
        openGraph: {
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
        },
    };
}

export default async function SuggestionPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <main>
            <SuggestionForm />
        </main>
    );
}
