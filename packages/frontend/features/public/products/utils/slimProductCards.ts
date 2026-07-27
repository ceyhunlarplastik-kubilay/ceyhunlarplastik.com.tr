import type { Product } from "@/features/public/products/types";

/**
 * Kart listesi için ürün payload'ını daraltır (ölçüm: 113KB → ~21KB / 20 ürün, ~%81).
 *
 * NEDEN: `/products` card view'ı bile kart için gereğinden fazlasını gönderiyor —
 * ölçülen dağılım (20 ürün, 113KB): attributeValues %49.6, category %27.5,
 * assets %7.9, translations %5.1. `ProductCard` ise yalnız şunları okuyor:
 * `name, code, slug`, assets'ten PRIMARY/IMAGE `url`, attributeValues'tan
 * `id, name, attribute.code, attribute.name`.
 * - `category`: kategori sayfasında zaten biliniyor, her üründe tekrar ediyordu.
 * - `attributeValues`: backend include'u 3 seviye özyinelemeli (attribute + translations
 *   + parentValue → tekrar attribute + translations + parentValue...). Kart bunların
 *   hiçbirini kullanmıyor.
 * - `translations`: API zaten locale'i çözüp name/slug'ı yerelleştiriyor.
 *
 * TİP GÜVENLİĞİ: `Product`'ın ZORUNLU alanları (categoryId/createdAt/updatedAt, toplam
 * ~1.7KB) korunur; yalnız opsiyonel/ağır alanlar atılır. Böylece dönüş tipi `Product[]`
 * olarak kalır ve `useProducts`'ın diğer 6 tüketicisi (admin, müşteri portalı) etkilenmez.
 *
 * NOT: Bu frontend katmanı yalnız SSR/RSC payload'ını küçültür. Client'ın filtre
 * sonrası yaptığı `/products` fetch'i hâlâ tam payload indirir — kalıcı çözüm
 * backend'de kart DTO'su (ayrı dilim).
 */
export function slimProductCards(products: Product[]): Product[] {
    return products.map((product) => ({
        id: product.id,
        code: product.code,
        name: product.name,
        slug: product.slug,
        // Product tipinde zorunlu → korunur (küçük alanlar)
        categoryId: product.categoryId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        assets: (product.assets ?? [])
            .filter(
                (asset: { role?: string; type?: string }) =>
                    asset?.role === "PRIMARY" || asset?.type === "IMAGE",
            )
            .map((asset: { id: string; role?: string; type?: string; url: string }) => ({
                id: asset.id,
                role: asset.role,
                type: asset.type,
                url: asset.url,
            })),
        attributeValues: (product.attributeValues ?? []).map(
            (value: {
                id: string;
                name: string;
                attribute?: { code?: string; name?: string };
            }) => ({
                id: value.id,
                name: value.name,
                attribute: value.attribute
                    ? { code: value.attribute.code, name: value.attribute.name }
                    : undefined,
            }),
        ),
    }));
}
