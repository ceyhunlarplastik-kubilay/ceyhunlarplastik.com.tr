"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateSupplierVariantPrice } from "@/features/supplier/variantPrices/api/updateSupplierVariantPrice"

export function useUpdateSupplierVariantPrice(endpointPrefix: "supplier" | "purchasing" = "supplier") {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: updateSupplierVariantPrice,
        onSuccess() {
            if (endpointPrefix === "supplier") {
                toast.success("Değişiklik onaya gönderildi")
                qc.invalidateQueries({ queryKey: ["business-requests", "supplier"] })
                return
            }

            toast.success("Fiyat güncellendi")
            qc.invalidateQueries({ queryKey: ["supplier-variant-prices", endpointPrefix] })
        },
        onError() {
            toast.error(endpointPrefix === "supplier" ? "Talep oluşturulamadı" : "Fiyat güncellenemedi")
        },
    })
}
