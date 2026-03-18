"use client"

import { useQuery } from "@tanstack/react-query"
import { listAttributesWithValues } from "../api/listAttributesWithValues"

export function useAttributesForFilter() {
    return useQuery({
        queryKey: ["product-attributes-filter"],
        queryFn: listAttributesWithValues,
    })
}
