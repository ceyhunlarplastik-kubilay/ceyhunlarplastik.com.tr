"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getMeasurementRequirements } from "@/features/admin/productMeasurementRequirements/api/getMeasurementRequirements"
import { replaceMeasurementRequirements } from "@/features/admin/productMeasurementRequirements/api/replaceMeasurementRequirements"
import { variantMatrixQueryKey } from "@/features/admin/productVariantMatrix/hooks/useVariantMatrix"
import type { MeasurementRequirementInput } from "@/features/admin/productMeasurementRequirements/api/types"

export const measurementRequirementsQueryKey = (productId: string) =>
    ["admin-measurement-requirements", productId] as const

export function useMeasurementRequirements(productId: string) {
    return useQuery({
        queryKey: measurementRequirementsQueryKey(productId),
        queryFn: () => getMeasurementRequirements(productId),
        enabled: Boolean(productId),
    })
}

export function useReplaceMeasurementRequirements(productId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (requirements: MeasurementRequirementInput[]) =>
            replaceMeasurementRequirements({ productId, requirements }),
        onSuccess() {
            toast.success("Ölçü şablonu kaydedildi")
            queryClient.invalidateQueries({ queryKey: measurementRequirementsQueryKey(productId) })
            // Şablon ölçü kodunu belirler; sunucu kodları yeniden hesapladı.
            queryClient.invalidateQueries({ queryKey: variantMatrixQueryKey(productId) })
        },
        onError(error: any) {
            toast.error(error?.response?.data?.message ?? "Ölçü şablonu kaydedilemedi")
        },
    })
}
