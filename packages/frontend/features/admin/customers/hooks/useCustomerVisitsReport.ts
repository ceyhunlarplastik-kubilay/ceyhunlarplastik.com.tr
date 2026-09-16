"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getCustomerVisitsReport } from "@/features/admin/customers/api/getCustomerVisitsReport"

export const CUSTOMER_VISITS_REPORT_QUERY_KEY = "admin-customer-visits-report"

const schema = z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive().max(100),
    ownerUserId: z.uuid().optional(),
    customerStatus: z.enum(["LEAD", "CUSTOMER"]).optional(),
    status: z.enum(["PLANNED", "COMPLETED", "CANCELED"]).optional(),
    type: z.enum(["IN_PERSON", "PHONE", "VIDEO"]).optional(),
    outcome: z.enum(["POSITIVE", "FOLLOW_UP_NEEDED", "NOT_INTERESTED", "ORDER_PLACED"]).optional(),
    scheduledFrom: z.string().optional(),
    scheduledTo: z.string().optional(),
    stateId: z.number().int().positive().optional(),
    cityId: z.number().int().positive().optional(),
})

export function useCustomerVisitsReport(params: z.input<typeof schema>) {
    const normalized = useMemo(() => schema.parse(params), [params])

    return useQuery({
        queryKey: [CUSTOMER_VISITS_REPORT_QUERY_KEY, normalized],
        queryFn: () => getCustomerVisitsReport(normalized),
        placeholderData: (prev) => prev,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
