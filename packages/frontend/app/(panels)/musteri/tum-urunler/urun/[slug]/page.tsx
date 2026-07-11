import { notFound } from "next/navigation"
import Product3DModelSection from "@/features/public/products/components/Product3DModelSection"
import ProductCertificateSection from "@/features/public/products/components/ProductCertificateSection"
import ProductHero from "@/features/public/products/components/ProductHero"
import SimilarProductsRow from "@/features/public/products/components/SimilarProductsRow"
import ProductTechnicalDrawingSection from "@/features/public/products/components/ProductTechnicalDrawingSection"
import ProductUsageAreasTable from "@/features/public/products/components/ProductUsageAreasTable"
import ProductVariantTable from "@/features/public/products/components/ProductVariantTable"
import { getProductBySlug } from "@/features/public/products/server/getProductBySlug"
import { getProductsByCategory } from "@/features/public/products/server/getProductsByCategory"
import { getProductVariantTable } from "@/features/public/products/server/getProductVariantTable"
import { toSimilarProductItems } from "@/features/public/products/utils/similarProducts"
import { CustomerPortalProductDetailHeader } from "@/features/customerPortal/components/CustomerPortalProductDetailHeader"

export default async function CustomerPortalProductDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    const product = await getProductBySlug(slug)
    if (!product) notFound()

    const [variants, productsByCategory] = await Promise.all([
        getProductVariantTable(product.id),
        // 13 = 12 benzer ürün + ürünün kendisi ilk sayfadaysa yedek.
        getProductsByCategory(product.categoryId, "id", { limit: 13 }),
    ])

    const similarProducts = toSimilarProductItems(productsByCategory, product.id)

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
                    assemblyVideoAutoPlay
                />
            </div>

            <div id="product-variants">
                <ProductVariantTable
                    variants={variants}
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
            </div>

            <ProductUsageAreasTable product={product} collapsible />

            <div id="product-3d-model">
                <Product3DModelSection product={product} />
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
