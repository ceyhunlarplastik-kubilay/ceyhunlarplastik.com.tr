import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { getCategories } from "@/features/public/categories/server/getCategories"

import { PageHero } from "@/components/sections/PageHero"
import { CategoryCard } from "@/components/navigation/CategoryCard"

type PageProps = {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "public.products.meta" })

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: locale === "tr" ? "/urunler" : "/en/urunler",
            languages: {
                tr: "/urunler",
                en: "/en/urunler",
                "x-default": "/urunler",
            },
        },
        openGraph: {
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
        },
    }
}

export default async function ProductsPage({ params }: PageProps) {
    const { locale } = await params
    setRequestLocale(locale)

    const [t, tb, categories] = await Promise.all([
        getTranslations({ locale, namespace: "public.products" }),
        getTranslations({ locale, namespace: "shared.breadcrumbs" }),
        getCategories(),
    ])

    return (
        <main>

            <PageHero
                title={t("heroTitle")}
                breadcrumbs={[
                    { label: tb("home"), href: "/" },
                    { label: t("breadcrumbSelf") }
                ]}
            />

            <section className="mx-auto max-w-7xl px-6 py-20">

                {categories.length === 0 && (
                    <div className="text-center text-muted-foreground">
                        {t("empty")}
                    </div>
                )}

                <ul
                    className="
            grid gap-6
            grid-cols-2
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-6
          "
                >

                    {categories.map((category) => (

                        <li key={category.id}>

                            <CategoryCard
                                title={category.name}
                                code={category.code}
                                href={`/urun-kategori/${category.slug}`}
                                imageStatic={category.assets?.find(a => a.role === "PRIMARY")?.url ?? "/placeholder.webp"}
                                imageAnimated={category.assets?.find(a => a.role === "ANIMATION")?.url}
                            >
                                {category.name}
                            </CategoryCard>

                        </li>

                    ))}

                </ul>

            </section>

        </main>
    )
}
