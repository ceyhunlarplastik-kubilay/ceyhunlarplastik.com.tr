"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"
import { createManagedCustomerAddress } from "@/features/customerLocations/api/createManagedCustomerAddress"

export function useCreateManagedCustomerAddress(customerId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: AddressDraftFormValues) => createManagedCustomerAddress(customerId, input),
        onSuccess: async (customer) => {
            toast.success("Adres kaydedildi.")
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["sales-managed-customer", customer.id] }),
                queryClient.invalidateQueries({ queryKey: ["admin-customer", customer.id] }),
                queryClient.invalidateQueries({ queryKey: ["sales-managed-customers"] }),
                queryClient.invalidateQueries({ queryKey: ["admin-customers"] }),
                queryClient.invalidateQueries({ queryKey: ["customer-map-points"] }),
            ])
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Adres kaydedilemedi."
            toast.error(message)
        },
    })
}

