"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    updateManagedCustomerVisit,
    type UpdateManagedCustomerVisitInput,
} from "@/features/sales/visits/api/updateManagedCustomerVisit"
import { MANAGED_CUSTOMER_VISITS_REPORT_QUERY_KEY } from "@/features/sales/visits/hooks/useManagedCustomerVisitsReport"

export function useUpdateManagedCustomerVisit() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (input: UpdateManagedCustomerVisitInput) => updateManagedCustomerVisit(input),
        onSuccess() {
            qc.invalidateQueries({ queryKey: [MANAGED_CUSTOMER_VISITS_REPORT_QUERY_KEY] })
        },
    })
}
