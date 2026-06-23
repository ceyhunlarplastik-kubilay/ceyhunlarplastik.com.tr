"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getCustomerMapPoints } from "@/features/customerLocations/api/getCustomerMapPoints"

const boundsSchema = z.object({
    north: z.number().min(-90).max(90),
    south: z.number().min(-90).max(90),
    east: z.number().min(-180).max(180),
    west: z.number().min(-180).max(180),
    status: z.enum(["LEAD", "CUSTOMER"]).optional(),
    search: z.string().trim().optional(),
    assignedSalesUserId: z.string().trim().optional(),
})

export function useCustomerMapData(params?: z.input<typeof boundsSchema>) {
    const normalized = useMemo(
        () => (params ? boundsSchema.parse(params) : null),
        [params],
    )

    return useQuery({
        queryKey: ["customer-map-points", normalized],
        queryFn: () => getCustomerMapPoints(normalized!),
        enabled: Boolean(normalized),
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: true,
    })
}

