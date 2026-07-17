"use client"

import { useQuery } from "@tanstack/react-query"
import { useLocale } from "next-intl"
import { fetchProducts } from "../api/fetchProducts"

type Options = {
    refetchInterval?: number | false
}

export function useProducts(params: Record<string, any>, options: Options = {}) {
    const { refetchInterval = false } = options
    const locale = useLocale()
    const localizedParams = { ...params, locale }

    return useQuery({
        queryKey: ["products", localizedParams],
        queryFn: () => fetchProducts(localizedParams),
        // 🔥 React Query v5 çözümü
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60 * 5,
        refetchInterval,
    })
}
