"use client"

import { useQuery } from "@tanstack/react-query"
import { getProducts } from "@/features/admin/products/api/getProducts"

export function useProducts() {
    return useQuery({
        queryKey: ["admin-products"],
        queryFn: () => getProducts(),

    })
}
