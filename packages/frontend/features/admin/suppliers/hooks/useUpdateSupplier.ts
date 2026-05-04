"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateSupplier } from "@/features/admin/suppliers/api/updateSupplier"

export function useUpdateSupplier() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: updateSupplier,
        onSuccess: () => {
            toast.success("Tedarikçi bilgisi güncellendi")
            qc.invalidateQueries({ queryKey: ["admin-suppliers"] })
        },
        onError: () => {
            toast.error("Tedarikçi güncellenemedi")
        },
    })
}

