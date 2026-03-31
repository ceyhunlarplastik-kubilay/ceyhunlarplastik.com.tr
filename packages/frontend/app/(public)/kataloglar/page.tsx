import { CatalogCard } from "@/features/public/catalogs/components/CatalogCard"
import { getCategories } from "@/features/public/categories/server/getCategories"
import { PageHero } from "@/components/sections/PageHero"

export default async function CatalogPage() {
    const categories = await getCategories()

    const catalogs = categories.filter((c: any) =>
        c.assets?.some(
            (a: any) => a.type === "PDF" && a.role === "DOCUMENT"
        )
    )

    return (
        <main className="bg-neutral-50/30 min-h-screen">
            <PageHero
                title="Kataloglar"
                breadcrumbs={[
                    { label: "Ana Sayfa", href: "/" },
                    { label: "Kataloglar" }
                ]}
            />

            <section
                className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-8"
                aria-labelledby="catalogs-heading"
            >
                {/* <div className="text-center mb-16">
                    <h2 id="catalogs-heading" className="text-3xl md:text-4xl font-heading font-extrabold text-neutral-900 mb-4">
                        Ürün Kataloglarımız
                    </h2>
                    <p className="text-neutral-600 max-w-2xl mx-auto">
                        Ceyhunlar Plastik'in geniş ürün yelpazesini, teknik detaylarını ve üretim standartlarını içeren güncel kataloglarımızı buradan inceleyebilirsiniz.
                    </p>
                </div> */}

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
