import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Product3DModelSection from "@/features/public/products/components/Product3DModelSection"
import ProductAssemblyVideoSection from "@/features/public/products/components/ProductAssemblyVideoSection"
import ProductCertificateSection from "@/features/public/products/components/ProductCertificateSection"
import ProductHero from "@/features/public/products/components/ProductHero"
import SimilarProductsRow from "@/features/public/products/components/SimilarProductsRow"
import ProductTechnicalDrawingSection from "@/features/public/products/components/ProductTechnicalDrawingSection"
import ProductUsageAreasTable from "@/features/public/products/components/ProductUsageAreasTable"
import ProductVariantTable from "@/features/public/products/components/ProductVariantTable"
import { getProductBySlug } from "@/features/public/products/server/getProductBySlug"
import { getProductsByCategory } from "@/features/public/products/server/getProductsByCategory"
import { getProductVariantTable } from "@/features/public/products/server/getProductVariantTable"

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
        getProductsByCategory(product.categoryId, "id"),
    ])

    const similarProducts = productsByCategory
        .filter((item) => item.id !== product.id)
        .slice(0, 12)

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                <Button asChild variant="ghost" className="px-0 text-neutral-500 hover:bg-transparent hover:text-neutral-900">
                    <Link href="/musteri/tum-urunler">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Tüm Ürünlere Dön
                    </Link>
                </Button>
                <div className="mt-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                        {product.category?.name ?? "Kategori"}
                    </div>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">{product.name}</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                        Ürün modelini inceleyin, ölçü gruplarına göre varyant seçeneklerini görüntüleyin ve portal içinden varyant detayına geçin.
                    </p>
                </div>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
                <ProductHero product={product} />
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
            <div id="product-assembly-video">
                <ProductAssemblyVideoSection product={product} />
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
