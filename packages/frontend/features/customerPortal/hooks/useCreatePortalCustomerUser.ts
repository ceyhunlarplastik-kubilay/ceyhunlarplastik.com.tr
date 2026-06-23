"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createPortalCustomerUser } from "@/features/customerPortal/api/createPortalCustomerUser"

export function useCreatePortalCustomerUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createPortalCustomerUser,
        onSuccess: async (customer) => {
            toast.success("Kullanıcı daveti gönderildi.")
            queryClient.setQueryData(["customer-portal-profile"], customer)
            await queryClient.invalidateQueries({ queryKey: ["customer-portal-profile"] })
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Kullanıcı daveti gönderilirken bir hata oluştu."
            toast.error(message)
        },
    })
}
