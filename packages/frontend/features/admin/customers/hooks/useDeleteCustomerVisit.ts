"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteCustomerVisit } from "@/features/admin/customers/api/deleteCustomerVisit"

export function useDeleteCustomerVisit(customerId: string) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (visitId: string) => deleteCustomerVisit(customerId, visitId),
        onSuccess() {
            qc.invalidateQueries({ queryKey: ["admin-customer-visits", customerId] })
            qc.invalidateQueries({ queryKey: ["admin-customer", customerId] })
        },
    })
}
