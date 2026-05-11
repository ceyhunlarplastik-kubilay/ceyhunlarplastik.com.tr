"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCustomerVisit, type UpdateCustomerVisitInput } from "@/features/admin/customers/api/updateCustomerVisit"

export function useUpdateCustomerVisit(customerId: string) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpdateCustomerVisitInput, "customerId">) =>
            updateCustomerVisit({ customerId, ...input }),
        onSuccess() {
            qc.invalidateQueries({ queryKey: ["admin-customer-visits", customerId] })
            qc.invalidateQueries({ queryKey: ["admin-customer", customerId] })
        },
    })
}
