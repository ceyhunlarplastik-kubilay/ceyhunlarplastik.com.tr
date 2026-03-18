"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProduct } from "@/features/admin/products/api/updateProduct"

export function useUpdateProduct() {

    const queryClient = useQueryClient()

    return useMutation({

        mutationFn: updateProduct,

        onSuccess() {
            queryClient.invalidateQueries({
                queryKey: ["admin-products"]
            })
        }

    })

}