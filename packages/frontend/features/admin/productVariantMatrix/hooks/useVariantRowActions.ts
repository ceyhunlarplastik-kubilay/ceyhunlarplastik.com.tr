"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    bulkDeleteVariantRows,
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

/**
 * Toplu silme. Engelli satırlar işlemi düşürmez: silinebilenler silinir,
 * engelliler kodu ve sebebiyle bildirilir ve çağıran onları seçili tutabilir.
 */
export function useBulkDeleteVariantRows(productId: string) {
    const invalidate = useMatrixInvalidation(productId)

    return useMutation({
        mutationFn: (variantIds: string[]) => bulkDeleteVariantRows({ productId, variantIds }),
        onSuccess(result) {
            if (result.deletedIds.length > 0) {
                toast.success(
                    `${result.deletedIds.length} varyant silindi` +
                    (result.rewrittenCodes > 0 ? ` · ${result.rewrittenCodes} kod güncellendi` : ""),
                )
            }

            if (result.blocked.length > 0) {
                // Tek satırda hepsini saymak yerine ilk birkaçını kodla göster:
                // kullanıcı hangi satırı seçimden çıkaracağını bilmeli.
                const preview = result.blocked.slice(0, 3).map((row) => `${row.fullCode} (${row.reason})`)
                const rest = result.blocked.length - preview.length
                toast.warning(
                    `${result.blocked.length} varyant silinemedi: ${preview.join(" · ")}` +
                    (rest > 0 ? ` ve ${rest} tane daha` : ""),
                    { duration: 8000 },
                )
            }

            invalidate()
        },
        onError(error: any) {
            toast.error(error?.response?.data?.message ?? "Varyantlar silinemedi")
        },
    })
}
