"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    createMachineDowntime,
    deleteMachineDowntime,
    listMachineDowntimes,
    updateMachineDowntime,
} from "@/features/production/downtimes/api/machineDowntimes"
import type { MachineDowntimeInput } from "@/features/production/downtimes/api/types"
import { recentDowntimesWindow } from "@/features/production/downtimes/lib/downtimeList"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

/**
 * Son 30 günün ve sonrasının duruşları. Pencere başı GÜNE yuvarlı ve bağlandığı anda
 * sabitlenir: makine tablosu ile duruş bölümü aynı anahtarı üretir, tek istek atılır.
 */
export function useRecentMachineDowntimes() {
    const [listWindow] = useState(() => recentDowntimesWindow(new Date()))
    return useQuery({
        queryKey: productionQueryKeys.machineDowntimes(listWindow),
        queryFn: () => listMachineDowntimes(listWindow),
    })
}

function useInvalidateDowntimes() {
    const qc = useQueryClient()
    return () => qc.invalidateQueries({ queryKey: productionQueryKeys.machineDowntimesAll() })
}

export function useCreateMachineDowntime() {
    const invalidate = useInvalidateDowntimes()
    return useMutation({
        mutationFn: (input: MachineDowntimeInput) => createMachineDowntime(input),
        onSuccess: invalidate,
    })
}

export function useUpdateMachineDowntime() {
    const invalidate = useInvalidateDowntimes()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<MachineDowntimeInput> }) => updateMachineDowntime(id, input),
        onSuccess: invalidate,
    })
}

export function useDeleteMachineDowntime() {
    const invalidate = useInvalidateDowntimes()
    return useMutation({
        mutationFn: (id: string) => deleteMachineDowntime(id),
        onSuccess: invalidate,
    })
}
