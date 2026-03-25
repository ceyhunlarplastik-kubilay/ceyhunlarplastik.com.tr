"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchProducts } from "../api/fetchProducts"

export function useProducts(params: Record<string, any>) {
    return useQuery({
        queryKey: ["products", params],
        queryFn: () => fetchProducts(params),
        // 🔥 React Query v5 çözümü
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60 * 5,
    })
}
