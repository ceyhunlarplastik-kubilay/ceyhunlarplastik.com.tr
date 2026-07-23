"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import {
    getMeasurementTypes,
    type GetMeasurementTypesParams,
} from "@/features/admin/measurementTypes/api/getMeasurementTypes"

const measurementTypeParamsSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    sort: z.string().trim().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    code: z.enum([
        "D",
        "D1",
        "D2",
        "R",
        "R1",
        "R2",
        "L",
        "L1",
        "L2",
        "T",
        "A",
        "W",
        "H",
        "H1",
        "H2",
        "PT",
        "M",
        "R_L",
    ]).optional(),
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
