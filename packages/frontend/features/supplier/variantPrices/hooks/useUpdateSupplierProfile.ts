"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateSupplierProfile } from "@/features/supplier/variantPrices/api/updateSupplierProfile"

export function useUpdateSupplierProfile() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: updateSupplierProfile,
        onSuccess: () => {
            toast.success("Tedarikçi bilgileri güncellendi")
            qc.invalidateQueries({ queryKey: ["supplier-profile"] })
        },
        onError: () => {
            toast.error("Tedarikçi bilgileri güncellenemedi")
        },
    })
}

