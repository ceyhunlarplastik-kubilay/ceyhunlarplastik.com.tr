import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactContent } from "@/features/public/contact/components/ContactContent";

type PageProps = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "public.contact.meta" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: locale === "tr" ? "/iletisim" : "/en/iletisim",
            languages: {
                tr: "/iletisim",
                en: "/en/iletisim",
                "x-default": "/iletisim",
            },
        },
        openGraph: {
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
        },
    };
}

export default async function ContactPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <ContactContent />;
}
