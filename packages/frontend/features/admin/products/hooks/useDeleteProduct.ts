"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteProduct } from "@/features/admin/products/api/deleteProduct"

export function useDeleteProduct() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteProduct,
        onSuccess() {
            queryClient.invalidateQueries({
                queryKey: ["admin-products"]
            })
        }
    })
}
