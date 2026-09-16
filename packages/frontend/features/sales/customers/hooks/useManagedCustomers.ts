"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getManagedCustomers } from "@/features/sales/customers/api/getManagedCustomers"

const schema = z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive().max(100),
    search: z.string().trim().optional(),
    status: z.enum(["LEAD", "CUSTOMER"]).optional(),
    sectorValueId: z.string().trim().min(1).optional(),
    countryId: z.number().int().positive().optional(),
    stateId: z.number().int().positive().optional(),
    cityId: z.number().int().positive().optional(),
})

export function useManagedCustomers(params: z.input<typeof schema>, options: { enabled?: boolean } = {}) {
    const normalized = useMemo(() => schema.parse(params), [params])

    return useQuery({
        queryKey: ["sales-managed-customers", normalized],
        queryFn: () => getManagedCustomers(normalized),
        enabled: options.enabled ?? true,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
