"use client"

import { useParams } from "next/navigation"

import { ProductVariantsManager } from "@/features/admin/productVariants/components/ProductVariantsManager"

export default function ProductVariantsPage() {
    const params = useParams<{ id: string | string[] }>()
    const rawId = params?.id
    const productId = Array.isArray(rawId) ? rawId[0] : rawId

    if (!productId) {
        return (
            <div className="p-6 text-sm text-red-500">
                Ürün bilgisi bulunamadı.
            </div>
        )
    }

    return <ProductVariantsManager productId={productId} />
}
