"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateSupplierProfile } from "@/features/supplier/variantPrices/api/updateSupplierProfile"

export function useUpdateSupplierProfile() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: updateSupplierProfile,
        onSuccess: () => {
            toast.success("Profil güncelleme talebi onaya gönderildi")
            qc.invalidateQueries({ queryKey: ["business-requests", "supplier"] })
        },
        onError: () => {
            toast.error("Talep oluşturulamadı")
        },
    })
}
