"use client"

import { useParams } from "next/navigation"
import { Layers3 } from "lucide-react"

import { ProductVariantMatrixPageClient } from "@/features/admin/productVariantMatrix/components/ProductVariantMatrixPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminProductVariantsPage() {
    const params = useParams()
    const productId = String(params?.id ?? "")

    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Layers3 className="size-20" strokeWidth={1.5} />}
                    title="Varyantlar yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <ProductVariantMatrixPageClient
                productId={productId}
                productsBasePath="/admin/products"
                canManageCodes
                canDeleteVersions
            />
        </PageLoadingGate>
    )
}
