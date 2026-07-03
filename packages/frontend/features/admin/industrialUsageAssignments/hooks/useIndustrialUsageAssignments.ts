"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/features/admin/productAttributes/api/errorHelpers"
import {
    industrialUsageAssignmentKeys,
    listIndustrialUsageAssignmentProducts,
    patchIndustrialUsageAssignmentProducts,
} from "@/features/admin/industrialUsageAssignments/api/industrialUsageAssignmentsApi"
import type {
    ListIndustrialUsageAssignmentProductsParams,
    PatchIndustrialUsageAssignmentProductsBody,
} from "@/features/admin/industrialUsageAssignments/api/types"

type QueryOptions = {
    usageAreaValueId: string
    params: ListIndustrialUsageAssignmentProductsParams
}

export function useIndustrialUsageAssignmentProducts({
    usageAreaValueId,
    params,
}: QueryOptions) {
    return useQuery({
        queryKey: industrialUsageAssignmentKeys.products(usageAreaValueId, params),
        queryFn: () => listIndustrialUsageAssignmentProducts(usageAreaValueId, params),
        enabled: Boolean(usageAreaValueId),
        placeholderData: (previous) => previous,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}

export function usePatchIndustrialUsageAssignmentProducts(usageAreaValueId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (body: PatchIndustrialUsageAssignmentProductsBody) =>
            patchIndustrialUsageAssignmentProducts(usageAreaValueId, body),
        onSuccess: (payload) => {
            toast.success(
                `${payload.added} ürün eklendi, ${payload.removed} ürün çıkarıldı.`,
            )
            return queryClient.invalidateQueries({
                queryKey: industrialUsageAssignmentKeys.all,
            })
        },
        onError: (error) => {
            toast.error(
                getApiErrorMessage(
                    error,
                    "Kullanım alanı ürün atamaları güncellenemedi.",
                ),
            )
        },
    })
}
