import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { PageHero } from "@/components/sections/PageHero"
import InquiryCartPageClient from "@/features/public/cart/components/InquiryCartPageClient"

type PageProps = {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "public.cart.meta" })

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: locale === "tr" ? "/sepet" : "/en/sepet",
            languages: {
                tr: "/sepet",
                en: "/en/sepet",
                "x-default": "/sepet",
            },
        },
        // Sepet indekslenmesin (kişisel/geçici içerik)
        robots: { index: false, follow: false },
    }
}

export default async function CartPage({ params }: PageProps) {
    const { locale } = await params
    setRequestLocale(locale)

    const [t, tb] = await Promise.all([
        getTranslations({ locale, namespace: "public.cart" }),
        getTranslations({ locale, namespace: "shared.breadcrumbs" }),
    ])

    return (
        <main>
            <PageHero
                title={t("heroTitle")}
                breadcrumbs={[
                    { label: tb("home"), href: "/" },
                    { label: t("breadcrumbSelf") },
                ]}
            />
            <InquiryCartPageClient />
        </main>
    )
}
