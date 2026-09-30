"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createMold, deleteMold, listMolds, recordMoldMaintenance, setMoldMachineCycle, updateMold } from "@/features/production/molds/api/molds"
import type { MoldInput } from "@/features/production/molds/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

export function useMolds() {
    return useQuery({
        queryKey: productionQueryKeys.molds(),
        queryFn: listMolds,
    })
}

/** Kalıp sayısı ölçü sözlüğünde ("bu ölçüyü basan kalıp") görünür; birlikte tazelenir. */
function useInvalidateMoldViews() {
    const qc = useQueryClient()
    return () => qc.invalidateQueries({ queryKey: productionQueryKeys.all })
}

export function useCreateMold() {
    const invalidate = useInvalidateMoldViews()
    return useMutation({
        mutationFn: (input: MoldInput) => createMold(input),
        onSuccess: invalidate,
    })
}

export function useUpdateMold() {
    const invalidate = useInvalidateMoldViews()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: MoldInput }) => updateMold(id, input),
        onSuccess: invalidate,
    })
}

export function useDeleteMold() {
    const invalidate = useInvalidateMoldViews()
    return useMutation({
        mutationFn: (id: string) => deleteMold(id),
        onSuccess: invalidate,
    })
}

/** Bakım durumu planlama tahtasında da görünür; tüm üretim görünümleri tazelenir. */
export function useRecordMoldMaintenance() {
    const invalidate = useInvalidateMoldViews()
    return useMutation({
        mutationFn: (id: string) => recordMoldMaintenance(id),
        onSuccess: invalidate,
    })
}

/** Çevrim önerisini karta yazar; plan önerileri ve istatistikler kart çevrimini okuduğu için hepsi tazelenir. */
export function useSetMoldMachineCycle() {
    const invalidate = useInvalidateMoldViews()
    return useMutation({
        mutationFn: setMoldMachineCycle,
        onSuccess: invalidate,
    })
}
