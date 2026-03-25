import { Suspense } from "react"

import { getCategories } from "@/features/public/categories/server/getCategories"
// import { getAttributesForFilter } from "@/features/admin/productAttributes/server/getAttributesForFilter"
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter"

import ProductFilterSidebar from "@/features/public/products/components/ProductFilterSidebar"
import ProductFilterList from "@/features/public/products/components/ProductFilterList"

import ProductGridSkeleton from "@/features/public/products/components/ProductGridSkeleton"

import { PageHero } from "@/components/sections/PageHero";

export default async function Page({ searchParams }: any) {

    const categories = await getCategories()
    const attributes = await getAttributesForFilter()

    return (
        <main>

            {/* HERO */}
            <PageHero
                title="Tüm ürünler"
                breadcrumbs={[
                    { label: "Ana Sayfa", href: "/" },
                    { label: "Ürünler", href: "/urunler" },
                    { label: "Tüm ürünler" }
                ]}
            />

            {/* FILTER + PRODUCTS */}
            <section className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-12 gap-8">

                {/* LEFT FILTER */}
                <aside className="col-span-3">
                    <ProductFilterSidebar
                        categories={categories}
                        attributes={attributes}
                    />
                </aside>

                {/* RIGHT PRODUCTS */}
                <section className="col-span-9">
                    <Suspense fallback={<ProductGridSkeleton />}>
                        <ProductFilterList />
                    </Suspense>
                </section>

            </section>

        </main>
    )
}