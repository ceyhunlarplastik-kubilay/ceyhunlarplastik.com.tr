"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { bulkUpdateSupplierVariantPricing } from "@/features/admin/suppliers/api/bulkUpdateSupplierVariantPricing"

export function useBulkUpdateSupplierVariantPricing() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: bulkUpdateSupplierVariantPricing,
        onSuccess: (payload) => {
            toast.success(`${payload.count} varyant satırı güncellendi.`)
            queryClient.invalidateQueries({ queryKey: ["supplier-variant-suppliers"] })
        },
        onError: () => {
            toast.error("Toplu fiyat güncellemesi yapılamadı")
        },
    })
}
