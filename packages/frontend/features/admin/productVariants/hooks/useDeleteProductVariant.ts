"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteProductVariant } from "@/features/admin/productVariants/api/deleteProductVariant"

export function useDeleteProductVariant(productId: string) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: deleteProductVariant,
        onSuccess() {
            toast.success("Varyant silindi")
            qc.invalidateQueries({
                queryKey: ["admin-product-variants", productId],
            })
        },
        onError() {
            toast.error("Varyant silinemedi")
        },
    })
}
