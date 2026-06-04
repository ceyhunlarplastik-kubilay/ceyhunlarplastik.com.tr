"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createPortalCustomerAddress } from "@/features/customerPortal/api/createPortalCustomerAddress"

export function useCreatePortalCustomerAddress() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createPortalCustomerAddress,
        onSuccess: async (customer) => {
            toast.success("Adres kaydedildi.")
            queryClient.setQueryData(["customer-portal-profile"], customer)
            await queryClient.invalidateQueries({ queryKey: ["customer-portal-profile"] })
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Adres kaydedilirken bir hata oluştu."
            toast.error(message)
        },
    })
}
