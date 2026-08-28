"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { optimizeCustomerRoute } from "@/features/customerLocations/api/optimizeCustomerRoute"

export function useOptimizeCustomerRoute() {
    return useMutation({
        mutationFn: optimizeCustomerRoute,
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Rota hesaplanamadı."
            toast.error(message)
        },
    })
}
