"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getManagedSuppliers } from "@/features/purchasing/suppliers/api/getManagedSuppliers"

const schema = z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive().max(100),
    search: z.string().trim().optional(),
})

export function useManagedSuppliers(params: z.input<typeof schema>) {
    const normalized = useMemo(() => schema.parse(params), [params])

    return useQuery({
        queryKey: ["purchasing-managed-suppliers", normalized],
        queryFn: () => getManagedSuppliers(normalized),
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
