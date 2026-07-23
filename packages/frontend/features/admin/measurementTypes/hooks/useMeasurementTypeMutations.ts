"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createMeasurementType } from "@/features/admin/measurementTypes/api/createMeasurementType"
import { deleteMeasurementType } from "@/features/admin/measurementTypes/api/deleteMeasurementType"
import { updateMeasurementType } from "@/features/admin/measurementTypes/api/updateMeasurementType"

function useInvalidateMeasurementTypes() {
    const queryClient = useQueryClient()

    return () => {
        queryClient.invalidateQueries({ queryKey: ["admin-measurement-types"] })
        queryClient.invalidateQueries({ queryKey: ["admin-product-variant-references"] })
    }
}

export function useCreateMeasurementType() {
    const invalidate = useInvalidateMeasurementTypes()

    return useMutation({
        mutationFn: createMeasurementType,
        onSuccess() {
            toast.success("Ölçü tipi oluşturuldu")
            invalidate()
        },
        onError() {
            toast.error("Ölçü tipi oluşturulamadı")
        },
    })
}

export function useUpdateMeasurementType() {
    const invalidate = useInvalidateMeasurementTypes()

    return useMutation({
        mutationFn: updateMeasurementType,
        onSuccess() {
            toast.success("Ölçü tipi güncellendi")
            invalidate()
        },
        onError() {
            toast.error("Ölçü tipi güncellenemedi")
        },
    })
}

export function useDeleteMeasurementType() {
    const invalidate = useInvalidateMeasurementTypes()

    return useMutation({
        mutationFn: deleteMeasurementType,
        onSuccess() {
            toast.success("Ölçü tipi silindi")
            invalidate()
        },
        onError() {
            toast.error("Ölçü tipi silinemedi. Bu ölçü tipi kullanılan varyantlara bağlı olabilir.")
        },
    })
}
