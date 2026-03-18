"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProduct } from "@/features/admin/products/api/createProduct"

export function useCreateProduct() {

    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createProduct,
        onSuccess() {
            queryClient.invalidateQueries({
                queryKey: ["admin-products"]
            })
        }
    })
}
