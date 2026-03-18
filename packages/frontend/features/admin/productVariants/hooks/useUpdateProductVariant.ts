"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateProductVariant } from "@/features/admin/productVariants/api/updateProductVariant"

export function useUpdateProductVariant(productId: string) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: updateProductVariant,
        onSuccess() {
            toast.success("Varyant güncellendi")
            qc.invalidateQueries({
                queryKey: ["admin-product-variants", productId],
            })
        },
        onError() {
            toast.error("Varyant güncellenemedi")
        },
    })
}
