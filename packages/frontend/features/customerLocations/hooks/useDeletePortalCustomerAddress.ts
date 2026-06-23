"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { deletePortalCustomerAddress } from "@/features/customerLocations/api/deletePortalCustomerAddress"

export function useDeletePortalCustomerAddress(addressId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => deletePortalCustomerAddress(addressId),
        onSuccess: async (customer) => {
            toast.success("Adres silindi.")
            queryClient.setQueryData(["customer-portal-profile"], customer)
            await queryClient.invalidateQueries({ queryKey: ["customer-portal-profile"] })
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Adres silinemedi."
            toast.error(message)
        },
    })
}
