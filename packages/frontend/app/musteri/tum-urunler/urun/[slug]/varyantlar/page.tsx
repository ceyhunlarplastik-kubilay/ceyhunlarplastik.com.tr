import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProductTechnicalDrawingSection from "@/features/public/products/components/ProductTechnicalDrawingSection"
import { getProductBySlug } from "@/features/public/products/server/getProductBySlug"
import { getProductVariantTable } from "@/features/public/products/server/getProductVariantTable"
import { buildMeasurementKey } from "@/features/public/products/utils/measurement"
import { CustomerPortalVariantDetailsTable } from "@/features/customerPortal/components/CustomerPortalVariantDetailsTable"

type PageProps = {
    params: Promise<{ slug: string }>
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function CustomerPortalVariantDetailPage({ params, searchParams }: PageProps) {
    const { slug } = await params
    const resolvedSearchParams = await searchParams

    const measurementKey =
        typeof resolvedSearchParams?.m === "string" ? resolvedSearchParams.m : undefined

    const product = await getProductBySlug(slug)
    if (!product) notFound()

    const variants = await getProductVariantTable(product.id)
    const filtered = measurementKey
        ? variants.filter((variant) => buildMeasurementKey(variant.measurements) === measurementKey)
        : []

    const selectedMeasurements =
        filtered[0]?.measurements
            ?.slice()
            .sort((a, b) => a.measurementType.displayOrder - b.measurementType.displayOrder) ?? []

    const primaryAsset = product.assets?.find((asset) => asset?.role === "PRIMARY")

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                <Button asChild variant="ghost" className="px-0 text-neutral-500 hover:bg-transparent hover:text-neutral-900">
                    <Link href={`/musteri/tum-urunler/urun/${product.slug}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Ürün Modeline Dön
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-2 lg:gap-8">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
                    {primaryAsset?.url ? (
                        <Image
                            src={primaryAsset.url}
                            alt={product.name}
                            fill
                            className="object-contain"
                            sizes="(min-width: 1024px) 50vw, 100vw"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                            Görsel bulunamadı
                        </div>
                    )}
                </div>

                <div className="flex flex-col justify-center space-y-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                        {product.category?.name ?? "Kategori"}
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{product.name}</h1>
                    <p className="text-sm text-neutral-500">Ürün Kodu: {product.code}</p>
                    {product.description ? (
                        <p className="text-sm leading-7 text-neutral-700">{product.description}</p>
                    ) : null}
                </div>
            </div>

            <CustomerPortalVariantDetailsTable
                variants={filtered}
                selectedMeasurements={selectedMeasurements}
                technicalDrawing={<ProductTechnicalDrawingSection product={product} compact />}
                productName={product.name}
                productId={product.id}
                productSlug={product.slug}
                productCode={product.code}
                categoryName={product.category?.name}
            />
        </div>
    )
}
