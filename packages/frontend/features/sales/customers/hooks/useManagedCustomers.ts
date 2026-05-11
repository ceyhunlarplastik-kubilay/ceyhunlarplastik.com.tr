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
})

export function useManagedCustomers(params: z.input<typeof schema>) {
    const normalized = useMemo(() => schema.parse(params), [params])

    return useQuery({
        queryKey: ["sales-managed-customers", normalized],
        queryFn: () => getManagedCustomers(normalized),
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
