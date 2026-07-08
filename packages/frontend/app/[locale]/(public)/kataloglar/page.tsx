import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { CatalogCard } from "@/features/public/catalogs/components/CatalogCard"
import { getCategories } from "@/features/public/categories/server/getCategories"
import { PageHero } from "@/components/sections/PageHero"

type PageProps = {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "public.catalog.meta" })

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: locale === "tr" ? "/kataloglar" : "/en/kataloglar",
            languages: {
                tr: "/kataloglar",
                en: "/en/kataloglar",
                "x-default": "/kataloglar",
            },
        },
        openGraph: {
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
        },
    }
}

export default async function CatalogPage({ params }: PageProps) {
    const { locale } = await params
    setRequestLocale(locale)

    const [t, tb, categories] = await Promise.all([
        getTranslations({ locale, namespace: "public.catalog" }),
        getTranslations({ locale, namespace: "shared.breadcrumbs" }),
        getCategories(),
    ])

    const catalogs = categories.filter((c: any) =>
        c.assets?.some(
            (a: any) => a.type === "PDF" && a.role === "DOCUMENT"
        )
    )

    return (
        <main className="bg-neutral-50/30 min-h-screen">
            <PageHero
                title={t("heroTitle")}
                breadcrumbs={[
                    { label: tb("home"), href: "/" },
                    { label: t("breadcrumbSelf") }
                ]}
            />

            <section
                className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-8"
                aria-labelledby="catalogs-heading"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
                    {catalogs.map((category: any) => (
                        <CatalogCard
                            key={category.id}
                            category={category}
                        />
                    ))}
                </div>
            </section>
        </main>
    )
}
