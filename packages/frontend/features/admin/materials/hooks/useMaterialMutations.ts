"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { adminApiClient } from "@/lib/http/client"
import { createMaterial } from "@/features/admin/materials/api/createMaterial"
import { deleteMaterial } from "@/features/admin/materials/api/deleteMaterial"
import { presignMaterialAsset } from "@/features/admin/materials/api/presignMaterialAsset"
import { updateMaterial } from "@/features/admin/materials/api/updateMaterial"

function useInvalidateMaterials() {
    const queryClient = useQueryClient()

    return () => {
        queryClient.invalidateQueries({ queryKey: ["admin-materials"] })
        queryClient.invalidateQueries({ queryKey: ["admin-product-variant-references"] })
    }
}

export function useCreateMaterial() {
    const invalidate = useInvalidateMaterials()

    return useMutation({
        mutationFn: createMaterial,
        onSuccess() {
            toast.success("Ham madde oluşturuldu")
            invalidate()
        },
        onError() {
            toast.error("Ham madde oluşturulamadı")
        },
    })
}

export function useUpdateMaterial() {
    const invalidate = useInvalidateMaterials()

    return useMutation({
        mutationFn: updateMaterial,
        onSuccess() {
            toast.success("Ham madde güncellendi")
            invalidate()
        },
        onError() {
            toast.error("Ham madde güncellenemedi")
        },
    })
}

export function useDeleteMaterial() {
    const invalidate = useInvalidateMaterials()

    return useMutation({
        mutationFn: deleteMaterial,
        onSuccess() {
            toast.success("Ham madde silindi")
            invalidate()
        },
        onError() {
            toast.error("Ham madde silinemedi. Bu ham madde kullanılan varyantlara bağlı olabilir.")
        },
    })
}

export function usePresignMaterialAsset() {
    return useMutation({
        mutationFn: presignMaterialAsset,
    })
}

export function useDeleteMaterialAsset() {
    const invalidate = useInvalidateMaterials()

    return useMutation({
        mutationFn: async (assetId: string) => {
            await adminApiClient.delete(`/assets/${assetId}`)
        },
        onSuccess() {
            toast.success("Sertifika silindi")
            invalidate()
        },
        onError() {
            toast.error("Sertifika silinemedi")
        },
    })
}
