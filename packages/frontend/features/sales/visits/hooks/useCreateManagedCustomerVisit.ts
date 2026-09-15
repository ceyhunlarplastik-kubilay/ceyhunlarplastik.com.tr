"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    createManagedCustomerVisit,
    type CreateManagedCustomerVisitInput,
} from "@/features/sales/visits/api/createManagedCustomerVisit"
import { MANAGED_CUSTOMER_VISITS_REPORT_QUERY_KEY } from "@/features/sales/visits/hooks/useManagedCustomerVisitsReport"

export function useCreateManagedCustomerVisit() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (input: CreateManagedCustomerVisitInput) => createManagedCustomerVisit(input),
        onSuccess() {
            qc.invalidateQueries({ queryKey: [MANAGED_CUSTOMER_VISITS_REPORT_QUERY_KEY] })
        },
    })
}
