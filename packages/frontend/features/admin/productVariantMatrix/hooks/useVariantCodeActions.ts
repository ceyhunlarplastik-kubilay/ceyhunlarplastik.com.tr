"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { renumberVariantCodes } from "@/features/admin/productVariantMatrix/api/renumberVariantCodes"
import { setVariantCodeLock } from "@/features/admin/productVariantMatrix/api/setVariantCodeLock"
import { variantMatrixQueryKey } from "@/features/admin/productVariantMatrix/hooks/useVariantMatrix"

export function useSetVariantCodeLock(productId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (locked: boolean) => setVariantCodeLock({ productId, locked }),
        onSuccess(product) {
            toast.success(
                product.variantCodesLockedAt
                    ? "Kodlar kilitlendi — yeni ölçüler artık sona eklenecek"
                    : "Kilit açıldı — sonraki kayıtlarda kodlar yeniden sıralanabilir",
            )
            queryClient.invalidateQueries({ queryKey: variantMatrixQueryKey(productId) })
        },
        onError(error: any) {
            toast.error(error?.response?.data?.message ?? "Kilit durumu değiştirilemedi")
        },
    })
}

export function useRenumberVariantCodes(productId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => renumberVariantCodes(productId),
        onSuccess(result) {
            toast.success(`Kodlar yeniden verildi — ${result.rewrittenCodes} kod yazıldı`)
            queryClient.invalidateQueries({ queryKey: variantMatrixQueryKey(productId) })
        },
        onError(error: any) {
            toast.error(error?.response?.data?.message ?? "Kodlar yeniden verilemedi")
        },
    })
}
