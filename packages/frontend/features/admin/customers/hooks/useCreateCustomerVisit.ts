"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCustomerVisit, type CreateCustomerVisitInput } from "@/features/admin/customers/api/createCustomerVisit"

export function useCreateCustomerVisit(customerId: string) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<CreateCustomerVisitInput, "customerId">) =>
            createCustomerVisit({ customerId, ...input }),
        onSuccess() {
            qc.invalidateQueries({ queryKey: ["admin-customer-visits", customerId] })
            qc.invalidateQueries({ queryKey: ["admin-customer", customerId] })
        },
    })
}
