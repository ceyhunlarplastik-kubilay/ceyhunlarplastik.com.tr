import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProductHero from "@/features/public/products/components/ProductHero"
import ProductTechnicalDrawingSection from "@/features/public/products/components/ProductTechnicalDrawingSection"
import ProductUsageAreasTable from "@/features/public/products/components/ProductUsageAreasTable"
import ProductVariantTable from "@/features/public/products/components/ProductVariantTable"
import { getProductBySlug } from "@/features/public/products/server/getProductBySlug"
import { getProductVariantTable } from "@/features/public/products/server/getProductVariantTable"

export default async function CustomerPortalProductDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    const product = await getProductBySlug(slug)
    if (!product) notFound()

    const variants = await getProductVariantTable(product.id)

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

            <ProductVariantTable
                variants={variants}
                productSlug={product.slug}
                productId={product.id}
                technicalDrawing={<ProductTechnicalDrawingSection product={product} compact />}
                variantDetailsPathname={`/musteri/tum-urunler/urun/${product.slug}/varyantlar`}
            />

            <ProductUsageAreasTable product={product} />
        </div>
    )
}
