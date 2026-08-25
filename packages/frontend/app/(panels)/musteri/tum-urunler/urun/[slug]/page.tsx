import { notFound } from "next/navigation"

import ProductHero from "@/features/public/products/components/ProductHero"
import SimilarProductsRow from "@/features/public/products/components/SimilarProductsRow"
import ProductTechnicalDrawingSection from "@/features/public/products/components/ProductTechnicalDrawingSection"
import ProductUsageAreasTable from "@/features/public/products/components/ProductUsageAreasTable"
import ProductVariantTable from "@/features/public/products/components/ProductVariantTable"
import { VariantTableFooter } from "@/features/public/products/components/VariantTableFooter"
import Product3DModelSection from "@/features/public/products/components/Product3DModelSection"
import ProductAssemblyVideoSection from "@/features/public/products/components/ProductAssemblyVideoSection"
import ProductPromoVideoSection from "@/features/public/products/components/ProductPromoVideoSection"
import ProductCertificateSection from "@/features/public/products/components/ProductCertificateSection"
import { getProductBySlug } from "@/features/public/products/server/getProductBySlug"
import { getProductsByCategory } from "@/features/public/products/server/getProductsByCategory"
import { getProductVariantTable } from "@/features/public/products/server/getProductVariantTable"
import { toSimilarProductItems } from "@/features/public/products/utils/similarProducts"
import { CustomerPortalProductDetailHeader } from "@/features/customerPortal/components/CustomerPortalProductDetailHeader"

export default async function CustomerPortalProductDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
    const { slug } = await params
    const resolvedSearchParams = await searchParams
    const page = Number(
        typeof resolvedSearchParams?.page === "string" ? resolvedSearchParams.page : 1,
    )

    const product = await getProductBySlug(slug)
    if (!product) notFound()

    const [variantTable, productsByCategory] = await Promise.all([
        // Panel zaten dinamik (auth) — burada `searchParams` bir maliyet getirmiyor,
        // bu yüzden ölçü sayfalaması gerçek anlamda çalışır.
        getProductVariantTable(product.id, { page: Number.isFinite(page) && page > 0 ? page : 1 }),
        // 13 = 12 benzer ürün + ürünün kendisi ilk sayfadaysa yedek.
        getProductsByCategory(product.categoryId, "id", { limit: 13 }),
    ])

    const similarProducts = toSimilarProductItems(productsByCategory, product.id)
    const groupedVariantOptions = variantTable.options

    return (
        <div className="space-y-6">
            <CustomerPortalProductDetailHeader
                categoryName={product.category?.name}
                productName={product.name}
                description="Ürün modelini inceleyin, ölçü gruplarına göre varyant seçeneklerini görüntüleyin ve portal içinden varyant detayına geçin."
            />

            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
                <ProductHero
                    product={product}
                    showAssemblyVideoInline
                />
            </div>

            <div id="product-variants">
                <ProductVariantTable
                    options={groupedVariantOptions}
                    loadError={variantTable.error}
                    productSlug={product.slug}
                    productId={product.id}
                    technicalDrawing={(
                        <div id="product-technical-drawing">
                            <ProductTechnicalDrawingSection product={product} compact />
                        </div>
                    )}
                    variantDetailsPathname={`/musteri/tum-urunler/urun/${product.slug}/varyantlar`}
                    focusOnMeasurements
                />
                <VariantTableFooter
                    meta={variantTable.meta}
                    shownCount={groupedVariantOptions.length}
                    basePath={`/musteri/tum-urunler/urun/${product.slug}`}
                />
            </div>

            <ProductUsageAreasTable product={product} collapsible />

            <div id="product-3d-model">
                <Product3DModelSection product={product} options={groupedVariantOptions} />
            </div>
            <div id="product-assembly-video">
                <ProductAssemblyVideoSection product={product} />
            </div>
            <div id="product-promo-video">
                <ProductPromoVideoSection product={product} />
            </div>
            <div id="product-certificate">
                <ProductCertificateSection product={product} />
            </div>

            <SimilarProductsRow
                products={similarProducts}
                hrefBasePath="/musteri/tum-urunler/urun"
            />
        </div>
    )
}
