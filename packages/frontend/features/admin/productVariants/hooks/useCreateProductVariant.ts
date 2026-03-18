"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createProductVariant } from "@/features/admin/productVariants/api/createProductVariant"

export function useCreateProductVariant(productId: string) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: createProductVariant,
        onSuccess() {
            toast.success("Varyant oluşturuldu")
            qc.invalidateQueries({
                queryKey: ["admin-product-variants", productId],
            })
        },
        onError() {
            toast.error("Varyant oluşturulamadı")
        },
    })
}
