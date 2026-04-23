"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateSupplierVariantPrice } from "@/features/supplier/variantPrices/api/updateSupplierVariantPrice"

export function useUpdateSupplierVariantPrice() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: updateSupplierVariantPrice,
        onSuccess() {
            toast.success("Fiyat güncellendi")
            qc.invalidateQueries({ queryKey: ["supplier-variant-prices"] })
        },
        onError() {
            toast.error("Fiyat güncellenemedi")
        },
    })
}
