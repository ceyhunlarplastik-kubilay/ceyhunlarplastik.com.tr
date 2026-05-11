"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCustomer, type UpdateCustomerInput } from "@/features/admin/customers/api/updateCustomer"

export function useUpdateCustomer() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (input: UpdateCustomerInput) => updateCustomer(input),
        onSuccess(customer) {
            qc.invalidateQueries({ queryKey: ["admin-customers"] })
            qc.invalidateQueries({ queryKey: ["admin-customer", customer.id] })
        },
    })
}
