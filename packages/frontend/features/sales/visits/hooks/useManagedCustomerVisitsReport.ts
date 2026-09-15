"use client"

import { useQuery } from "@tanstack/react-query"
import {
    getManagedCustomerVisitsReport,
    type GetManagedCustomerVisitsReportParams,
} from "@/features/sales/visits/api/getManagedCustomerVisitsReport"

export const MANAGED_CUSTOMER_VISITS_REPORT_QUERY_KEY = "sales-managed-customer-visits-report"

export function useManagedCustomerVisitsReport(params: GetManagedCustomerVisitsReportParams) {
    return useQuery({
        queryKey: [MANAGED_CUSTOMER_VISITS_REPORT_QUERY_KEY, params],
        queryFn: () => getManagedCustomerVisitsReport(params),
        placeholderData: (prev) => prev,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
