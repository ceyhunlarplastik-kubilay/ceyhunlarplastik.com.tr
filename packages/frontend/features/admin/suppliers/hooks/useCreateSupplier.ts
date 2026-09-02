"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createSupplier } from "@/features/admin/suppliers/api/createSupplier"

export function useCreateSupplier() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createSupplier,
        onSuccess: () => {
            toast.success("Tedarikçi oluşturuldu")
            qc.invalidateQueries({ queryKey: ["admin-suppliers"] })
        },
        onError: () => {
            toast.error("Tedarikçi oluşturulamadı")
        },
    })
}
