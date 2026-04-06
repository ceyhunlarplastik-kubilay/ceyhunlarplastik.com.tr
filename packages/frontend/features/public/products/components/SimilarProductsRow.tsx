"use client"

import { MotionMarquee } from "@/components/ui/MotionMarquee"
import { ProductCard } from "@/components/navigation/ProductCard"

type ProductItem = {
    id: string
    name: string
    code: string
    slug: string
    assets?: Array<{
        role?: string
        type?: string
        url?: string
    }>
}

type Props = {
    products: ProductItem[]
}

export default function SimilarProductsRow({ products }: Props) {
    if (!products?.length) return null

    return (
        <section className="pt-10">
            <div className="mb-4">
                <h2 className="text-xl font-semibold tracking-tight">Benzer Ürünler</h2>
                <p className="text-sm text-neutral-500">Aynı kategorideki diğer ürünlere göz atın.</p>
            </div>

            <MotionMarquee speed={10} direction="left" gap="gap-4">
                {products.map((product) => {
                    const primary = product.assets?.find((asset) => asset.role === "PRIMARY")
                    const fallback = product.assets?.find((asset) => asset.type === "IMAGE")
                    const image = primary?.url || fallback?.url || "/placeholder.webp"

                    return (
                        <div key={product.id} className="w-[210px] shrink-0">
                            <ProductCard
                                title={product.name}
                                code={product.code}
                                href={`/urun/${product.slug}`}
                                imageStatic={image}
                            />
                        </div>
                    )
                })}
            </MotionMarquee>
        </section>
    )
}

