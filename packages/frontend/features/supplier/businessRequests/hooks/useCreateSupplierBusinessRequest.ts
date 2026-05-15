"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createSupplierBusinessRequest } from "@/features/supplier/businessRequests/api/createSupplierBusinessRequest"

export function useCreateSupplierBusinessRequest(successMessage = "Talep onaya gönderildi") {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createSupplierBusinessRequest,
        onSuccess: () => {
            toast.success(successMessage)
            queryClient.invalidateQueries({ queryKey: ["business-requests", "supplier"] })
        },
        onError: () => {
            toast.error("Talep oluşturulamadı")
        },
    })
}
