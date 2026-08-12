"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    applyProductIndustrialUsageFunctions,
    getProductIndustrialUsageFunctions,
    industrialUsageFunctionKeys,
} from "@/features/admin/industrialUsageFunctions/api/industrialUsageFunctionsApi"
import type { ApplyIndustrialUsageFunctionsBody } from "@/features/admin/industrialUsageFunctions/api/types"

export function useProductIndustrialUsageFunctions(productId: string) {
    return useQuery({
        queryKey: industrialUsageFunctionKeys.byProduct(productId),
        queryFn: () => getProductIndustrialUsageFunctions(productId),
        enabled: Boolean(productId),
        placeholderData: (prev) => prev,
        refetchOnWindowFocus: false,
    })
}

export function useApplyProductIndustrialUsageFunctions(productId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (body: ApplyIndustrialUsageFunctionsBody) =>
            applyProductIndustrialUsageFunctions(productId, body),
        onSuccess: async (payload) => {
            // Aktarım sonrası önizlemenin "önceki metin" sütunu bayat kalmasın.
            await queryClient.invalidateQueries({
                queryKey: industrialUsageFunctionKeys.byProduct(productId),
            })

            toast.success(
                `${payload.touchedRows} satır güncellendi · ${payload.created} yeni, ${payload.updated} değişen çeviri`,
            )
        },
    })
}
