"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    deleteVariantRow,
    deleteVariantSupplier,
    updateVariantSupplier,
    type UpdateVariantSupplierInput,
} from "@/features/admin/productVariantMatrix/api/mutateVariantRows"
import { variantMatrixQueryKey } from "@/features/admin/productVariantMatrix/hooks/useVariantMatrix"

function useMatrixInvalidation(productId: string) {
    const queryClient = useQueryClient()
    return () => {
        queryClient.invalidateQueries({ queryKey: variantMatrixQueryKey(productId) })
        queryClient.invalidateQueries({ queryKey: ["admin-product-variants", productId] })
    }
}

export function useUpdateVariantSupplier(productId: string) {
    const invalidate = useMatrixInvalidation(productId)

    return useMutation({
        mutationFn: (input: Omit<UpdateVariantSupplierInput, "productId">) =>
            updateVariantSupplier({ productId, ...input }),
        onSuccess() {
            toast.success("Tedarikçi satırı güncellendi")
            invalidate()
        },
        onError(error: any) {
            toast.error(error?.response?.data?.message ?? "Tedarikçi satırı güncellenemedi")
        },
    })
}

export function useDeleteVariantSupplier(productId: string) {
    const invalidate = useMatrixInvalidation(productId)

    return useMutation({
        mutationFn: (supplierRowId: string) => deleteVariantSupplier({ productId, supplierRowId }),
        onSuccess() {
            toast.success("Tedarikçi satırı kaldırıldı")
            invalidate()
        },
        onError(error: any) {
            toast.error(error?.response?.data?.message ?? "Tedarikçi satırı kaldırılamadı")
        },
    })
}

export function useDeleteVariantRow(productId: string) {
    const invalidate = useMatrixInvalidation(productId)

    return useMutation({
        mutationFn: (variantId: string) => deleteVariantRow({ productId, variantId }),
        onSuccess() {
            toast.success("Varyant silindi ve kodlar güncellendi")
            invalidate()
        },
        onError(error: any) {
            // Sipariş/talep/özel fiyatta kullanılan varyant silinemez — sunucu
            // hangi kayıtların engellediğini mesajda söylüyor.
            toast.error(error?.response?.data?.message ?? "Varyant silinemedi")
        },
    })
}
