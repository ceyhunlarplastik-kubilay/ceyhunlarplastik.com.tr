"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import {
    getMeasurementTypes,
    type GetMeasurementTypesParams,
} from "@/features/admin/measurementTypes/api/getMeasurementTypes"
import { MEASUREMENT_CODES } from "@core/helpers/productVariants/measurementCodes"

const measurementTypeParamsSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    sort: z.string().trim().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    code: z.enum(MEASUREMENT_CODES).optional(),
    baseUnit: z.string().trim().optional(),
})

type Options = {
    params?: GetMeasurementTypesParams
    autoRefreshIntervalMs?: number | false
}

export function useMeasurementTypes({
    params = {},
    autoRefreshIntervalMs = false,
}: Options = {}) {
    const normalizedParams = useMemo(() => measurementTypeParamsSchema.parse(params), [params])

    return useQuery({
        queryKey: ["admin-measurement-types", normalizedParams],
        queryFn: () => getMeasurementTypes(normalizedParams),
        placeholderData: (prev) => prev,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
