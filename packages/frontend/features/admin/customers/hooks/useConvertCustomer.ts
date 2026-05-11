"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { convertCustomer } from "@/features/admin/customers/api/convertCustomer"

export function useConvertCustomer() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => convertCustomer(id),
        onSuccess(customer) {
            qc.invalidateQueries({ queryKey: ["admin-customers"] })
            qc.invalidateQueries({ queryKey: ["admin-customer", customer.id] })
        },
    })
}
