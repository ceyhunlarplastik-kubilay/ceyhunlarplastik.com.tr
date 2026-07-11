import type { Product } from "@/features/public/products/types"

export type SimilarProductItem = {
    id: string
    name: string
    code: string
    slug: string
    assets: Array<{
        role?: string
        type?: string
        url?: string
    }>
}

/**
 * Benzer ürünleri SimilarProductsRow'un gerçekten render ettiği alanlara indirger.
 *
 * Client component'e geçen props RSC flight payload'ı olarak HTML'e gömülür;
 * tam API objeleri (industrialUsages vb.) geçirmek sayfa yanıtını Lambda'nın
 * 6MB limitinin üzerine çıkarıyordu. Bu map, unstable_cache'ten dönen eski/şişkin
 * cache girdilerine karşı da koruma sağlar.
 */
export function toSimilarProductItems(
    products: Product[],
    excludeProductId: string,
    max = 12,
): SimilarProductItem[] {
    return products
        .filter((product) => product.id !== excludeProductId)
        .slice(0, max)
        .map((product) => ({
            id: product.id,
            name: product.name,
            code: product.code,
            slug: product.slug,
            assets: (product.assets ?? [])
                .filter((asset) => asset?.role === "PRIMARY" || asset?.type === "IMAGE")
                .map((asset) => ({
                    role: asset.role,
                    type: asset.type,
                    url: asset.url,
                })),
        }))
}
