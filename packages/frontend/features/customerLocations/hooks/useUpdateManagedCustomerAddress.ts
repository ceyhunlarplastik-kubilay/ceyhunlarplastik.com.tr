"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"
import { updateManagedCustomerAddress } from "@/features/customerLocations/api/updateManagedCustomerAddress"

export function useUpdateManagedCustomerAddress(customerId: string, addressId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: AddressDraftFormValues) => updateManagedCustomerAddress(customerId, addressId, input),
        onSuccess: async (customer) => {
            toast.success("Adres güncellendi.")
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["sales-managed-customer", customer.id] }),
                queryClient.invalidateQueries({ queryKey: ["admin-customer", customer.id] }),
                queryClient.invalidateQueries({ queryKey: ["sales-managed-customers"] }),
                queryClient.invalidateQueries({ queryKey: ["admin-customers"] }),
                queryClient.invalidateQueries({ queryKey: ["customer-map-points"] }),
            ])
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Adres güncellenemedi."
            toast.error(message)
        },
    })
}

