"use client"

import { useParams } from "next/navigation"
import { Layers3 } from "lucide-react"

import { ProductVariantMatrixPageClient } from "@/features/admin/productVariantMatrix/components/ProductVariantMatrixPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

/**
 * Veri girişi operatörünün varyant giriş ekranı — admin ile AYNI bileşen.
 *
 * `canManageCodes={false}`: kod kilidi ve yeniden numaralandırma yalnız yöneticide.
 * Backend de aynı sınırı uyguluyor (bkz. productVariantMatrix/actions.ts), buradaki
 * gizleme yalnız arayüz kolaylığı.
 */
export default function ContentEntryProductVariantsPage() {
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
                productsBasePath="/veri-girisi/products"
                canManageCodes={false}
            />
        </PageLoadingGate>
    )
}
