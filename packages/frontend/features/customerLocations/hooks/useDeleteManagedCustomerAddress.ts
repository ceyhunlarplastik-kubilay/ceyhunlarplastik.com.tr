"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteManagedCustomerAddress } from "@/features/customerLocations/api/deleteManagedCustomerAddress"

export function useDeleteManagedCustomerAddress(customerId: string, addressId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => deleteManagedCustomerAddress(customerId, addressId),
        onSuccess: async (customer) => {
            toast.success("Adres silindi.")
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["sales-managed-customer", customer.id] }),
                queryClient.invalidateQueries({ queryKey: ["admin-customer", customer.id] }),
                queryClient.invalidateQueries({ queryKey: ["sales-managed-customers"] }),
                queryClient.invalidateQueries({ queryKey: ["admin-customers"] }),
                queryClient.invalidateQueries({ queryKey: ["customer-map-points"] }),
            ])
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Adres silinemedi."
            toast.error(message)
        },
    })
}
