"use client"

import { useParams } from "next/navigation"

import { ProductVariantMatrixPageClient } from "@/features/admin/productVariantMatrix/components/ProductVariantMatrixPageClient"

export default function AdminProductVariantsPage() {
    const params = useParams()
    const productId = String(params?.id ?? "")

    return (
        <ProductVariantMatrixPageClient
            productId={productId}
            productsBasePath="/admin/products"
            canManageCodes
            canDeleteVersions
        />
    )
}
