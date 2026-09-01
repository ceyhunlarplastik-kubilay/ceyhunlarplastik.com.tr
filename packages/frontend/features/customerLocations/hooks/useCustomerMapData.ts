"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getCustomerMapPoints } from "@/features/customerLocations/api/getCustomerMapPoints"

const boundsSchema = z.object({
    // Viewport opsiyonel: segment "Haritada Göster" ile yüklendiğinde harita
    // bounds'u henüz gelmemiş olabilir; backend yoksa geniş pencere kullanır.
    north: z.number().min(-90).max(90).optional(),
    south: z.number().min(-90).max(90).optional(),
    east: z.number().min(-180).max(180).optional(),
    west: z.number().min(-180).max(180).optional(),
    status: z.enum(["LEAD", "CUSTOMER"]).optional(),
    search: z.string().trim().optional(),
    assignedSalesUserId: z.string().trim().optional(),
    sectorValueId: z.string().trim().optional(),
    usageAreaValueId: z.string().trim().optional(),
    countryId: z.number().int().positive().optional(),
    stateId: z.number().int().positive().optional(),
    cityId: z.number().int().positive().optional(),
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

