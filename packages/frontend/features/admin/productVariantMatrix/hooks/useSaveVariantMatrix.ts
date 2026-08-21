"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { saveVariantMatrix } from "@/features/admin/productVariantMatrix/api/saveVariantMatrix"
import { variantMatrixQueryKey } from "@/features/admin/productVariantMatrix/hooks/useVariantMatrix"
import type { SaveVariantMatrixRowInput } from "@/features/admin/productVariantMatrix/api/types"

export function useSaveVariantMatrix(productId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (rows: SaveVariantMatrixRowInput[]) => saveVariantMatrix({ productId, rows }),
        onSuccess(result) {
            const parts = [`${result.createdVariants} varyant`]
            if (result.createdVariantSuppliers > 0) parts.push(`${result.createdVariantSuppliers} tedarikçi satırı`)
            if (result.rewrittenCodes > 0) parts.push(`${result.rewrittenCodes} kod yeniden yazıldı`)
            toast.success(`Kaydedildi — ${parts.join(", ")}`)

            queryClient.invalidateQueries({ queryKey: variantMatrixQueryKey(productId) })
            queryClient.invalidateQueries({ queryKey: ["admin-product-variants", productId] })
        },
        onError(error: any) {
            toast.error(error?.response?.data?.message ?? "Varyantlar kaydedilemedi")
        },
    })
}
