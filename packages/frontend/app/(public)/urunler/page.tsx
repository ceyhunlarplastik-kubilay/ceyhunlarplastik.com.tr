import type { Metadata } from "next"
import { getCategories } from "@/features/public/categories/server/getCategories"

import { PageHero } from "@/components/sections/PageHero"
import { CategoryCard } from "@/components/navigation/CategoryCard"

export const metadata: Metadata = {
    title: "Ürün Kategorileri | Ceyhunlar Plastik",
    description:
        "Ceyhunlar Plastik ürün kategorilerini inceleyin. Bakalit tutamaklar, plastik ürünler ve daha fazlası.",
    alternates: {
        canonical: "https://ceyhunlarplastik.com.tr/urunler",
    },
}

export default async function ProductsPage() {

    const categories = await getCategories()

    return (
        <main>

            <PageHero
                title="Ürün Kategorileri"
                breadcrumbs={[
                    { label: "Ana Sayfa", href: "/" },
                    { label: "Ürün Kategorileri" }
                ]}
            />

            <section className="mx-auto max-w-7xl px-6 py-20">

                {categories.length === 0 && (
                    <div className="text-center text-muted-foreground">
                        Ürün kategorisi bulunamadı.
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