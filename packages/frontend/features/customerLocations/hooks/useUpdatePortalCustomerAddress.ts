"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"
import { updatePortalCustomerAddress } from "@/features/customerLocations/api/updatePortalCustomerAddress"

export function useUpdatePortalCustomerAddress(addressId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: AddressDraftFormValues) => updatePortalCustomerAddress(addressId, input),
        onSuccess: async (customer) => {
            toast.success("Adres güncellendi.")
            queryClient.setQueryData(["customer-portal-profile"], customer)
            await queryClient.invalidateQueries({ queryKey: ["customer-portal-profile"] })
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Adres güncellenemedi."
            toast.error(message)
        },
    })
}

