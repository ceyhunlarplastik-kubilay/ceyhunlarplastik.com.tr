"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { listMaterialProfiles, upsertMaterialProfile } from "@/features/production/materials/api/materialProfiles"
import type { MaterialProfileInput } from "@/features/production/materials/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

export function useMaterialProfiles() {
    return useQuery({
        queryKey: productionQueryKeys.materialProfiles(),
        queryFn: listMaterialProfiles,
    })
}

export function useUpsertMaterialProfile() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ materialId, input }: { materialId: string; input: MaterialProfileInput }) =>
            upsertMaterialProfile(materialId, input),
        onSuccess: () => qc.invalidateQueries({ queryKey: productionQueryKeys.materialProfiles() }),
    })
}
