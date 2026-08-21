"use client"

import { useParams } from "next/navigation"

import { ProductVariantMatrixPageClient } from "@/features/admin/productVariantMatrix/components/ProductVariantMatrixPageClient"

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
        <ProductVariantMatrixPageClient
            productId={productId}
            productsBasePath="/veri-girisi/products"
            canManageCodes={false}
        />
    )
}
